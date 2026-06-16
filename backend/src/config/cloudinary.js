const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('Cloudinary Configured Successfully');
    return true;
  } else {
    console.log('Cloudinary credentials missing, using local upload folder fallback');
    return false;
  }
};

module.exports = { configureCloudinary, cloudinary };
