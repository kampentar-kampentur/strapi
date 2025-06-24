module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET"),
    },
  },
  upload: {
    config: {
    provider: 'cloudinary',
    providerOptions: {
      cloud_name: env('CLOUDINARY_CLOUD_NAME'),
      api_key: env('CLOUDINARY_API_KEY'),
      api_secret: env('CLOUDINARY_API_SECRET'),
    },
    actionOptions: {
      upload: {
        resource_type: 'auto', // Поддержка видео
      },
      eager: [
        {
          width: 300,
          height: 200,
          crop: 'fill',
          format: 'jpg',
          resource_type: 'video' // для видео превью
        }
      ],
      uploadStream: {
        resource_type: 'auto',
      },
      delete: {},
    },
  },
  },
});
