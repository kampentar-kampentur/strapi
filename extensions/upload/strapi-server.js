module.exports = (plugin) => {
  plugin.services.upload.formatFileInfo = ({ resource, file }) => {
    const { public_id, resource_type, format } = resource;

    // Базовый URL для превью
    let url = `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}`;

    if (resource_type === 'video') {
      // Для видео создаем превью как изображение
      url += `/image/upload/c_fill,w_300,h_200/${public_id}.jpg`;
    } else {
      // Для изображений используем оригинальный URL
      url += `/${resource_type}/upload/${public_id}.${format}`;
    }

    return {
      name: file.name,
      alternativeText: file.alternativeText,
      caption: file.caption,
      width: resource.width,
      height: resource.height,
      formats: resource.eager ? {
        thumbnail: {
          url: `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/image/upload/c_fill,w_150,h_150/${public_id}.jpg`,
          width: 150,
          height: 150,
        }
      } : undefined,
      hash: public_id,
      ext: `.${format}`,
      mime: file.type,
      size: Math.round(resource.bytes / 1000),
      url: url,
      previewUrl: url, // Важно для превью в админке
      provider: 'cloudinary',
      provider_metadata: {
        public_id,
        resource_type,
      },
    };
  };

  return plugin;
};