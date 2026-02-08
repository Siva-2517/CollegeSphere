const cloudinary = require("../config/cloudinary");

const uploadPoster = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "event_posters",
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = uploadPoster;
