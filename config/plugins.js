module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET"),
    },
  },
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('CF_R2_ACCESS_KEY_ID'),
            secretAccessKey: env('CF_R2_SECRET_ACCESS_KEY'),
          },
          endpoint: env('CF_R2_ENDPOINT'),
          region: env('AWS_REGION', 'auto'),
        },
        params: {
          Bucket: env('CF_R2_BUCKET'),
        },
        baseUrl: env('CF_R2_PUBLIC_URL'),
      },
      actionOptions: {
        upload: {
          optimize: true,
        },
        uploadStream: {},
        delete: {},
      },
    },
  },
});
