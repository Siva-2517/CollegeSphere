# 🚨 CollegeSphere - Complete Issue List (Before Fixes)

**Document Date:** January 29, 2026  
**Status:** Pre-Fix Analysis - All Issues Found in Initial Audit

---

## Summary Statistics

- **Critical Issues:** 8
- **High Priority Issues:** 5
- **Medium Priority Issues:** 3
- **Low Priority Issues:** 4
- **Total Issues:** 20

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### Issue #1: JWT Missing `isApproved` Field

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/auth.controllers.js` (Lines 36-43)  
**CWE:** CWE-863 Incorrect Authorization  
**Impact:** Approval enforcement broken, security risk

**Problem:**
```javascript
const token = jwt.sign(
  { Id: user._id, role: user.role }, // ❌ Missing isApproved
  process.env.JWT_SECRET,
  { expiresIn: "3h" },
);
```

**Why It's Critical:**
- Unapproved organizers cannot be blocked via JWT
- Backend must fetch user from DB on every request to verify approval status
- Frontend can decode token and see "approved" organizers who are actually not approved
- Prevents enforcement of organizer approval requirement

**Attack Scenario:**
1. Register as organizer (isApproved: false)
2. Login (JWT doesn't include isApproved)
3. Attempt to create event (no approval check possible)
4. Event creation succeeds (should fail with 403)

**Current Impact:** Organizers can bypass approval workflow entirely

---

### Issue #2: No Approval Check on Event Creation

**Severity:** 🔴 CRITICAL  
**Location:** `server/routes/event.routes.js` (Line 5)  
**CWE:** CWE-863 Incorrect Authorization  
**Impact:** Unapproved organizers can create events without admin approval

**Problem:**
```javascript
router.post("/create", protect(["admin", "organizer"]), createEvent);
// ❌ No check that organizer is approved
```

**Why It's Critical:**
- Unapproved organizers can immediately create unlimited events
- No admin approval required
- Can impersonate other colleges
- Can spam event listing with fake events
- Damages trust in the platform

**Attack Flow:**
1. Eve registers as organizer (isApproved: false)
2. Eve logs in
3. Eve creates event under College B's ID
4. Event appears in College B's listing
5. Reputational damage to College B

**Controller Code is Also Vulnerable:**
```javascript
// server/controllers/event.controllers.js (Lines 9-31)
const newEvent = await Event.create({
  // ❌ No isApproved check before allowing creation
  createdBy: req.user.Id,
});
```

**Current Impact:** Entire event approval workflow is broken

---

### Issue #3: Event Update Missing Ownership Check

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/event.controllers.js` (Lines 119-147)  
**CWE:** CWE-639 Authorization Bypass Through Missing Ownership Check  
**Impact:** Organizers can modify events owned by other organizers

**Problem:**
```javascript
exports.updateEvent = async (req, res) => {
    // ❌ No check that event belongs to logged-in organizer
    const updatedEvent = await Event.findByIdAndUpdate(eventId, {...});
}
```

**Why It's Critical:**
- Any organizer can update ANY event from ANY college
- Organizers can steal/vandalize other colleges' events
- Can inject malicious content (change event title to scam link, etc.)
- Can change event dates, venues, deadlines
- No audit trail of who changed what

**Attack Scenario:**
1. Attacker learns victim's event ID from public API
2. Attacker calls PUT /api/event/{victim-event-id}
3. Attacker changes event title to "Fake Scholarship Scam"
4. Attacker changes venue to attacker's location
5. Students see malicious event details
6. Scam propagated via platform
7. Victim college loses credibility

**Current Impact:** Event data integrity compromised, reputation risk

---

### Issue #4: Event Delete Missing Ownership Check

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/event.controllers.js` (Lines 149-170)  
**CWE:** CWE-639 Authorization Bypass Through Missing Ownership Check  
**Impact:** Organizers can delete events owned by other organizers

**Problem:**
```javascript
exports.deleteEvent = async (req, res) => {
  // ❌ No ownership check
  await Event.findByIdAndDelete(eventId);
};
```

**Why It's Critical:**
- Any organizer can delete ANY event
- Causes data loss
- Breaks registrations of already-registered students
- Registered students have no recourse
- Event disappears without trace
- Registration data lost

**Attack Scenario:**
1. Attacker discovers popular event from rival college
2. Attacker calls DELETE /api/event/{rival-event-id}
3. Event disappears from platform
4. 500+ registered students receive no notification
5. Event organizer has no record of what happened
6. Students can't find their registrations
7. Sabotage complete

**Current Impact:** Data loss risk, no authorization boundary between organizers

---

### Issue #5: Deadline Field Name Mismatch

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/regis.controller.js` (Line 21)  
**CWE:** CWE-573 Improper Following of Specification by Caller  
**Impact:** Deadline enforcement completely broken

**Problem:**
```javascript
if (new Date() > event.registrationDeadline) {
  return res.status(400).json({ message: "Registration deadline has passed" });
}
```

**Field Name Mismatch:**
- Event schema defines: `deadline` (correct)
- Code checks: `registrationDeadline` (wrong field name)
- `event.registrationDeadline` is always `undefined`
- Comparison: `new Date() > undefined` evaluates to `false`
- Deadline check NEVER WORKS

**Why It's Critical:**
- Deadline enforcement completely broken
- Anyone can register at any time (even after deadline)
- Late registrations always possible
- Event planning becomes impossible
- Database bloats with late registrations
- Defeats entire deadline mechanism

**Attack Scenario:**
1. Event deadline: 2026-02-10
2. Current date: 2026-02-15 (5 days AFTER deadline)
3. Student tries to register: POST /api/registration/register/event-id
4. Backend checks: if (new Date() > event.registrationDeadline)
5. event.registrationDeadline = undefined
6. new Date() > undefined = false (check FAILS)
7. Student registers successfully (WRONG - should be rejected)

**Current Impact:** Zero deadline enforcement, registration can continue indefinitely

---

### Issue #6: Anyone Can Register as Admin

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/auth.controllers.js` + `client/src/pages/Register.jsx` (Line ~285)  
**CWE:** CWE-269 Improper Access Control  
**CVSS Score:** 9.8 (Critical)  
**Impact:** Role escalation vulnerability - anyone can become admin

**Problem - Backend:**
```javascript
// server/controllers/auth.controllers.js
const newUser = await User.create({
  name,
  email,
  password,
  role, // ❌ Takes ANY role from request - no validation!
});
```

**Problem - Frontend:**
```javascript
// client/src/pages/Register.jsx (Line ~285)
<select name="role" ...>
  <option value="student">Student</option>
  <option value="organizer">Organizer</option>
  <option value="admin">Admin</option> {/* ❌ Should not be here */}
</select>
```

**Why It's Critical:**
- Anyone on internet can register as admin
- Backend has NO role validation
- Frontend offers admin as selectable option
- Once registered as admin, attacker gains full platform access
- Can approve/reject any organizer
- Can approve/reject any event
- Can delete any event
- Can view all user data

**Attack Scenario:**
1. Attacker visits registration page
2. Attacker selects role: "admin"
3. Attacker submits registration
4. Backend creates user with role: "admin" (no validation)
5. Attacker logs in with admin token
6. Attacker accesses admin dashboard
7. Attacker approves their fake organizer account
8. Attacker creates fake events under fake colleges
9. Platform compromised

**Attack Steps in Detail:**
```
POST /api/register
{
  "name": "Fake Admin",
  "email": "attacker@evil.com",
  "password": "Password123!",
  "role": "admin"  // ← Can choose any role!
}

Response: 201 User created with role: "admin"
```

**Current Impact:** COMPLETE PLATFORM COMPROMISE POSSIBLE

---

### Issue #7: No Deadline Validation on Event Update

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/event.controllers.js` (Lines 119-147)  
**CWE:** CWE-573 Improper Following of Specification  
**Impact:** Invalid event dates possible

**Problem:**
```javascript
const updatedEvent = await Event.findByIdAndUpdate(eventId, {
  title,
  date,
  deadline, // ❌ No validation that deadline < date
  // ...
});
```

**Why It's Critical:**
- Admin/organizer can set invalid deadline (after event date)
- Causes registration logic confusion
- Event might have deadline AFTER event has already happened
- Students register after event is over
- No validation prevents nonsensical date combinations

**Example of Invalid State:**
- Event Date: 2026-02-20
- Deadline: 2026-02-25 (5 days AFTER event)
- Students register between event date and deadline
- Event already passed, registration still open
- Confusing for students

**Current Impact:** Database can contain logically invalid events

---

### Issue #8: No Deadline Check on Cancellation

**Severity:** 🔴 CRITICAL  
**Location:** `server/controllers/regis.controller.js` (Lines 88-107)  
**CWE:** CWE-863 Incorrect Authorization  
**Impact:** Users can cancel registrations after deadline

**Problem:**
```javascript
exports.cancelRegistration = async (req, res) => {
  // ❌ No check that current date is before deadline
  const registration = await Registration.findByIdAndDelete(registrationId);
};
```

**Why It's Critical:**
- Students can cancel registration anytime (even after deadline)
- No cutoff date for cancellations
- Event organizers can't plan accurately
- Last-minute cancellations mess up event logistics
- Food orders, seat arrangements, materials - all affected

**Real-World Impact:**
- Event organizer orders food/materials based on registrations
- Deadline passes
- Student cancels anyway
- Food ordered for 100 people, only 95 show up
- Waste of resources

**Current Impact:** Event planning data is unreliable after deadline

---

## 🟠 HIGH PRIORITY ISSUES (Fix This Week)

### Issue #9: Wrong Endpoint for Event Registrations

**Severity:** 🟠 HIGH  
**Location:** `server/routes/regis.routes.js` (Line 11)  
**CWE:** CWE-863 Incorrect Authorization  
**Impact:** Organizers see wrong data + can see all registrations without ownership check

**Problem:**
```javascript
router.get(
  "/event/:eventId",
  protect(["organizer", "admin"]),
  getMyRegistrations, // ❌ WRONG FUNCTION
);
```

**Current Behavior:**
- Uses `getMyRegistrations` function
- Filters by `user: req.user.Id`
- Returns registrations WHERE USER IS REGISTERED
- NOT registrations FOR AN EVENT

**What Organizers Need:**
- View all registrations FOR THEIR EVENT
- See which students registered
- See which students canceled

**What Actually Happens:**
- Organizer calls GET /api/registration/event/{event-id}
- Gets user's own registrations (not event registrations)
- NO ownership check
- Organizer can view ANY event's registrations by guessing event IDs
- Organizer can see all student registrations across all events

**Why It's High Priority:**
- Organizers can't see their own event registrations
- Privacy violation: organizers see all registrations
- No ownership verification
- Breaks organizer functionality

**Current Impact:** Wrong data for organizers, privacy leak

---

### Issue #10: Organizer Approval Status Invisible

**Severity:** 🟠 HIGH  
**Location:** `client/src/pages/OrganizerDashboard.jsx`  
**Impact:** Confusing UX for unapproved organizers

**Problem:**
- No indication on dashboard whether organizer is approved or pending
- Unapproved organizer sees dashboard but:
  - Can't create events (no approval check yet - bug #2)
  - No message explaining why they can't create events
  - No indication when approval status will change
  - No contact for admin help

**Why It's High Priority:**
- Unapproved organizers are confused
- Support team gets confused support tickets
- "Why can't I create events?"
- "When will I be approved?"
- "Who do I contact?"
- Bad user experience

**Current Impact:** UX confusion, support burden, user frustration

---

### Issue #11: Auth Logic Duplicated (No ProtectedRoute)

**Severity:** 🟠 HIGH  
**Location:** `client/src/App.jsx` + all dashboard files  
**Impact:** Hard to maintain, no token expiry check

**Problem:**
- Each dashboard (StudentDashboard.jsx, OrganizerDashboard.jsx, AdminDashboard.jsx) has duplicate auth logic
- Check if token exists: `localStorage.getItem('token')`
- Check user role matches page: `userData.role === 'student'`
- No centralized protection
- No token expiry checking
- Hard to update (change in 3 places)

**Why It's High Priority:**
- Code duplication hard to maintain
- No protection against expired tokens
- Users with expired tokens can still access dashboards
- Inconsistent auth logic across application
- Security risk: no token validation

**Example of Duplication:**
```javascript
// StudentDashboard.jsx
useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!token || userData.role !== 'student') {
    // redirect
  }
}, []);

// OrganizerDashboard.jsx
useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!token || userData.role !== 'organizer') {
    // redirect
  }
}, []);

// AdminDashboard.jsx
useEffect(() => {
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('user'));
  if (!token || userData.role !== 'admin') {
    // redirect
  }
}, []);
// ❌ Same logic repeated 3 times
```

**Current Impact:** Maintenance burden, expired tokens not checked

---

## 🟡 MEDIUM PRIORITY ISSUES

### Issue #12: API Endpoint Mismatch - Event Registration

**Severity:** 🟡 MEDIUM  
**Location:** Multiple files (Frontend vs Backend mismatch)  
**Impact:** Potential registration failures, inconsistent API usage

**Problem:**
- Frontend may call different endpoint than backend provides
- Event registration endpoint inconsistency
- Registration cancel endpoint inconsistency

**Current Impact:** API integration issues, registration may fail

---

### Issue #13: Missing Error Handling in Controllers

**Severity:** 🟡 MEDIUM  
**Impact:** Incomplete error responses to frontend

**Problem:**
- Some error cases not handled
- Missing validation error messages
- Unclear error responses

**Current Impact:** Poor error reporting to users

---

### Issue #14: Database Query Optimization

**Severity:** 🟡 MEDIUM  
**Impact:** Performance issues with large datasets

**Problem:**
- No indexes on frequently queried fields
- N+1 query problems possible
- Full collection scans in some queries

**Current Impact:** Slow API responses with more data

---

## 🔵 LOW PRIORITY ISSUES

### Issue #15: Missing Input Validation

**Severity:** 🔵 LOW  
**Impact:** Malformed data could be stored

**Problem:**
- Insufficient input validation on registration
- No email format validation details
- No password strength validation details

---

### Issue #16: Missing Rate Limiting

**Severity:** 🔵 LOW  
**Impact:** Potential for abuse (spam registrations, brute force login)

**Problem:**
- No rate limiting on API endpoints
- Login endpoint can be brute forced
- Registration endpoint can be spammed
- Deadline check endpoint can be hammered

---

### Issue #17: No Request Logging

**Severity:** 🔵 LOW  
**Impact:** Hard to debug issues, no audit trail

**Problem:**
- No request logging
- No error logging with context
- Can't trace what happened in production

---

### Issue #18: Missing API Documentation

**Severity:** 🔵 LOW  
**Impact:** Harder to use API correctly

**Problem:**
- No OpenAPI/Swagger documentation
- Endpoint parameters not documented
- Response format not documented

---

### Issue #19: No Token Refresh Mechanism

**Severity:** 🔵 LOW  
**Impact:** Users must re-login when token expires

**Problem:**
- Token expires in 3 hours
- No refresh token mechanism
- Users lose session after 3 hours
- Must re-login

---

### Issue #20: Missing CORS Configuration Details

**Severity:** 🔵 LOW  
**Impact:** Potential CORS issues in production

**Problem:**
- CORS configuration might be too permissive
- Wildcard CORS allowed from all origins
- Should restrict to specific frontend domain

---

## Threat Matrix

### Threat #1: Unauthorized Event Creation by Unapproved Organizers

**Severity:** 🔴 CRITICAL  
**Contributing Bugs:** Issue #1, Issue #2  
**Fix Time:** 5 minutes  
**Proof of Concept:**
1. Register as organizer
2. Immediately try to create event
3. Should fail with 403 but currently succeeds

**Current Status:** EXPLOITABLE

---

### Threat #2: Event Hijacking/Vandalism by Other Organizers

**Severity:** 🔴 CRITICAL  
**Contributing Bugs:** Issue #3, Issue #4  
**Fix Time:** 10 minutes  
**Proof of Concept:**
1. Get eventId from another organizer (public API)
2. Call PUT /api/event/{eventId}
3. Should fail with 403 but currently succeeds

**Current Status:** EXPLOITABLE

---

### Threat #3: Registration Deadline Bypass

**Severity:** 🔴 CRITICAL  
**Contributing Bugs:** Issue #5  
**Fix Time:** 5 minutes  
**Proof of Concept:**
1. Try to register for event past deadline
2. Should fail but currently succeeds

**Current Status:** EXPLOITABLE

---

### Threat #4: Role Escalation (Anyone Can Become Admin)

**Severity:** 🔴 CRITICAL  
**Contributing Bugs:** Issue #6  
**Fix Time:** 2 minutes  
**Proof of Concept:**
1. POST /api/register with role: 'admin'
2. Should be rejected but currently allowed

**Current Status:** EXPLOITABLE

---

### Threat #5: Organizers Viewing All Event Registrations

**Severity:** 🟠 HIGH  
**Contributing Bugs:** Issue #9  
**Fix Time:** 10 minutes  
**Proof of Concept:**
1. GET /api/registration/event/{any-event-id} as organizer
2. No ownership check, can see all registrations

**Current Status:** EXPLOITABLE

---

## Fix Priority Timeline

### Phase 1: EMERGENCY (30 minutes)
Issues: #1, #2, #5, #6

### Phase 2: URGENT (1.5 hours)
Issues: #3, #4, #7, #8, #9, #10

### Phase 3: RECOMMENDED (1 hour)
Issues: #11, and architecture improvements

### Phase 4: OPTIONAL (Future)
Issues: #12-#20

---

## Risk Assessment

### Data Integrity Risk: CRITICAL
- Events can be modified by unauthorized users
- Events can be deleted by unauthorized users
- Registrations can be made after deadline

### Confidentiality Risk: HIGH
- Organizers can view other organizers' registration data
- No privacy controls on registrations

### Availability Risk: MEDIUM
- Events can be deleted (DOS)
- Registration deadline not enforced

### Compliance Risk: CRITICAL
- Role-based access control not enforced
- No audit trail of changes
- Admin role can be stolen

---

## Summary of All Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | JWT missing isApproved | 🔴 CRITICAL | UNFIXED |
| 2 | No approval check on event creation | 🔴 CRITICAL | UNFIXED |
| 3 | Event update missing ownership check | 🔴 CRITICAL | UNFIXED |
| 4 | Event delete missing ownership check | 🔴 CRITICAL | UNFIXED |
| 5 | Deadline field name mismatch | 🔴 CRITICAL | UNFIXED |
| 6 | Anyone can register as admin | 🔴 CRITICAL | UNFIXED |
| 7 | No deadline validation on update | 🔴 CRITICAL | UNFIXED |
| 8 | No deadline check on cancellation | 🔴 CRITICAL | UNFIXED |
| 9 | Wrong endpoint for event registrations | 🟠 HIGH | UNFIXED |
| 10 | Organizer approval status invisible | 🟠 HIGH | UNFIXED |
| 11 | Auth logic duplicated (no ProtectedRoute) | 🟠 HIGH | UNFIXED |
| 12 | API endpoint mismatch | 🟡 MEDIUM | UNFIXED |
| 13 | Missing error handling | 🟡 MEDIUM | UNFIXED |
| 14 | Database query optimization | 🟡 MEDIUM | UNFIXED |
| 15 | Missing input validation | 🔵 LOW | UNFIXED |
| 16 | Missing rate limiting | 🔵 LOW | UNFIXED |
| 17 | No request logging | 🔵 LOW | UNFIXED |
| 18 | Missing API documentation | 🔵 LOW | UNFIXED |
| 19 | No token refresh mechanism | 🔵 LOW | UNFIXED |
| 20 | CORS configuration | 🔵 LOW | UNFIXED |

---

**Document Status:** Complete - All Issues Documented  
**Last Updated:** January 29, 2026  
**Prepared by:** Security Audit Team
