const { getToolsForRole, executeTool } = require('../tools/ai.tools');

// Dynamic SDK imports with fallback handling
let GoogleGenAI = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAI = genaiPkg.GoogleGenAI || genaiPkg.default;
} catch (e) {
  // Package fallback handled gracefully
}

let Groq = null;
try {
  Groq = require('groq-sdk');
} catch (e) {
  // Package fallback handled gracefully
}

/**
 * Role-tailored system prompt builder enforcing strict permission boundaries.
 */
function buildSystemPrompt(user) {
  const role = user.role || 'student';
  const name = user.name || 'User';
  const collegeId = user.collegeId || 'N/A';

  let roleInstructions = '';
  if (role === 'student') {
    roleInstructions = `User Identity: Name="${name}", Role="student", CollegeID="${collegeId}".
CRITICAL ROLE & PERMISSION RULES FOR STUDENT:
- The user is a STUDENT.
- Students can ONLY: search events, view event details, view their own registrations, register for events, and cancel their registrations.
- Students CANNOT create events, draft events, manage organizers, or perform admin tasks under any circumstances!
- If a student asks to create an event or manage events, you MUST decline firmly and clearly state: "As a student, you cannot create events. Event creation is strictly reserved for approved organizers and college admins."
- NEVER state that a student is an organizer or that a student can create events!`;
  } else if (role === 'organizer') {
    const isApproved = user.isApproved === true;
    roleInstructions = `User Identity: Name="${name}", Role="organizer", CollegeID="${collegeId}", Is Approved Organizer=${isApproved}.
PERMISSIONS FOR ORGANIZER:
- If Is Approved Organizer is true: You can create event drafts, generate rules, list organizer events, and view registration stats.
- If Is Approved Organizer is false: Remind the user that their organizer account is pending admin approval and they cannot publish events until approved.`;
  } else if (role === 'admin') {
    roleInstructions = `User Identity: Name="${name}", Role="admin" (College Admin), CollegeID="${collegeId}".
PERMISSIONS FOR COLLEGE ADMIN:
- College Admin can approve or reject events and organizers belonging to their college, and view platform statistics.`;
  } else if (role === 'superadmin') {
    roleInstructions = `User Identity: Name="${name}", Role="superadmin" (System Super Admin).
PERMISSIONS FOR SUPER ADMIN:
- Full global multi-tenant system control: create/delete colleges, assign user roles, manage soft-deleted events, and view system diagnostics.`;
  }

  return `You are the CollegeSphere AI Assistant. You help users navigate and manage inter-college events.
${roleInstructions}

General Instructions:
1. Always be helpful, concise, friendly, and professional.
2. Use tools to query database or perform actions. Never invent fake event IDs or fake user roles.
3. If a tool returns 'requiresConfirmation: true', ask the user to confirm the action clearly.
4. Strictly enforce user permissions and role limits at all times.
5. When invoking tools, use native function calls. Do not write raw <function=> text markup in your message response.`;
}

/**
 * Core AI Processing Engine supporting Groq & Gemini with tool calling & confirmation protocol.
 */
async function processAIChat({ user, messages, confirmAction }) {
  const role = user.role || 'student';
  const tools = getToolsForRole(role);

  // Phase 2: If the client sent explicit confirmation for a pending action
  if (confirmAction && confirmAction.actionType) {
    const toolResult = await executeTool(
      confirmAction.actionType,
      confirmAction.payload,
      user,
      true // isConfirmed = true
    );

    return {
      reply: toolResult.message || `Action "${confirmAction.actionType}" executed successfully.`,
      result: toolResult,
      requiresConfirmation: false
    };
  }

  // Determine provider: Groq > Gemini > Fallback Simulator
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey && Groq) {
    return await processWithGroq({ user, messages, tools, apiKey: groqKey });
  } else if (geminiKey && GoogleGenAI) {
    return await processWithGemini({ user, messages, tools, apiKey: geminiKey });
  } else {
    return await processWithFallback({ user, messages, tools });
  }
}

/**
 * Groq LLM Handler (Llama 3.3 70B Versatile with Function Calling)
 */
async function processWithGroq({ user, messages, tools, apiKey }) {
  const groq = new Groq({ apiKey });
  const systemPrompt = buildSystemPrompt(user);

  // Format tools for Groq OpenAI format
  const formattedTools = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || ''
    }))
  ];

  try {
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        tools: formattedTools,
        tool_choice: 'auto',
        temperature: 0.2
      });

      const choice = response.choices[0];
      const assistantMsg = choice.message;

      // Check if model called a tool
      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        groqMessages.push(assistantMsg);

        for (const toolCall of assistantMsg.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs = {};
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            fnArgs = {};
          }

          // Execute tool with unconfirmed status first
          const toolOutput = await executeTool(fnName, fnArgs, user, false);

          // Intercept mutating actions requiring confirmation
          if (toolOutput && toolOutput.requiresConfirmation) {
            return {
              reply: `I am ready to ${toolOutput.summary}. Please confirm if you would like me to proceed.`,
              requiresConfirmation: true,
              pendingAction: {
                actionType: toolOutput.actionType,
                summary: toolOutput.summary,
                payload: toolOutput.payload
              }
            };
          }

          // Append tool result to messages loop
          groqMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: fnName,
            content: JSON.stringify(toolOutput)
          });
        }
      } else {
        // Model returned final natural text answer
        return {
          reply: assistantMsg.content || 'I have completed your request.',
          requiresConfirmation: false
        };
      }
    }

    return {
      reply: 'Request processing completed.',
      requiresConfirmation: false
    };
  } catch (err) {
    console.warn('Groq Execution Error (falling back):', err.message);
    if (process.env.GEMINI_API_KEY && GoogleGenAI) {
      return await processWithGemini({ user, messages, tools, apiKey: process.env.GEMINI_API_KEY });
    }
    return await processWithFallback({ user, messages, tools });
  }
}

/**
 * Gemini LLM Handler (@google/genai)
 */
async function processWithGemini({ user, messages, tools, apiKey }) {
  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(user);

  const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';

  // Format tools for Gemini SDK
  const functionDeclarations = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question: ${lastUserMsg}` }] }
      ],
      config: {
        tools: [{ functionDeclarations }]
      }
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0].functionCall;
      const fnName = call.name;
      const fnArgs = call.args || {};

      const toolOutput = await executeTool(fnName, fnArgs, user, false);

      if (toolOutput && toolOutput.requiresConfirmation) {
        return {
          reply: `I am ready to ${toolOutput.summary}. Please confirm to proceed.`,
          requiresConfirmation: true,
          pendingAction: {
            actionType: toolOutput.actionType,
            summary: toolOutput.summary,
            payload: toolOutput.payload
          }
        };
      }

      return {
        reply: `Here are the results for ${fnName}:\n\n${JSON.stringify(toolOutput, null, 2)}`,
        requiresConfirmation: false,
        data: toolOutput
      };
    }

    return {
      reply: response.text || 'How can I assist you with CollegeSphere events today?',
      requiresConfirmation: false
    };
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    return await processWithFallback({ user, messages, tools });
  }
}

/**
 * Smart Fallback Engine (Used when no API key is provided or APIs fail)
 */
async function processWithFallback({ user, messages, tools }) {
  const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  // If student asks to create event in fallback mode
  if (user.role === 'student' && (lastMsg.includes('create') || lastMsg.includes('add event') || lastMsg.includes('make event'))) {
    return {
      reply: 'As a student, you cannot create events. Event creation is strictly reserved for approved organizers and college admins.',
      requiresConfirmation: false
    };
  }

  // Smart Intent Detection
  if (lastMsg.includes('event') || lastMsg.includes('find') || lastMsg.includes('search') || lastMsg.includes('hackathon')) {
    const result = await executeTool('searchEvents', { query: lastMsg.replace(/find|search|event|events/gi, '').trim() }, user, false);
    
    let text = `🔍 **Found ${result.count || 0} event(s) in CollegeSphere:**\n\n`;
    if (result.events && result.events.length > 0) {
      result.events.forEach(e => {
        text += `• **${e.title}** (${e.category}) - 📅 ${new Date(e.date).toLocaleDateString()} @ ${e.collegeName}\n  *Type:* ${e.eventType.toUpperCase()} | *Venue:* ${e.venue}\n  *ID:* \`${e.id}\`\n\n`;
      });
      text += `Say *"Register me for [Event ID]"* to register!`;
    } else {
      text = `No matching events found for your query. Try searching by category like *"Coding"*, *"Cultural"*, or *"Sports"*!`;
    }

    return { reply: text, requiresConfirmation: false };
  }

  if (lastMsg.includes('registration') || lastMsg.includes('my event') || lastMsg.includes('enrolled')) {
    const result = await executeTool('getStudentRegistrations', {}, user, false);
    let text = `📋 **Your Event Registrations (${result.count || 0}):**\n\n`;
    if (result.registrations && result.registrations.length > 0) {
      result.registrations.forEach(r => {
        text += `• **${r.eventTitle}** on ${new Date(r.date).toLocaleDateString()}\n  *Venue:* ${r.venue} | *Registration ID:* \`${r.registrationId}\`\n\n`;
      });
    } else {
      text = `You haven't registered for any events yet. Ask me *"Show upcoming events"* to discover events!`;
    }
    return { reply: text, requiresConfirmation: false };
  }

  if (user.role === 'admin' && (lastMsg.includes('stat') || lastMsg.includes('analytic') || lastMsg.includes('pending'))) {
    const stats = await executeTool('getAdminAnalytics', {}, user, false);
    let text = `📊 **CollegeSphere Platform Analytics:**\n\n`;
    text += `• **Total Users:** ${stats.totalUsers}\n`;
    text += `• **Approved Events:** ${stats.approvedEvents} (Pending: ${stats.pendingEventsCount})\n`;
    text += `• **Total Registrations:** ${stats.totalRegistrations}\n`;
    text += `• **Pending Organizer Approvals:** ${stats.pendingOrganizersCount}\n`;
    return { reply: text, requiresConfirmation: false };
  }

  return {
    reply: `Hello ${user.name || 'there'}! I am your **CollegeSphere AI Assistant**.\n\nYou can ask me to:\n- 🔍 **Search upcoming events** by category, date, or type\n- 📋 **View your registered events**\n- 🎯 **Register or cancel event participation**\n\n*(Note: As a student, event creation is restricted to approved event organizers and admins.)*`,
    requiresConfirmation: false
  };
}

module.exports = {
  processAIChat
};
