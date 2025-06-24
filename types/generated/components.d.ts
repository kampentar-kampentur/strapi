import type { Schema, Struct } from '@strapi/strapi';

export interface BadgesBadges extends Struct.ComponentSchema {
  collectionName: 'components_badges_badges';
  info: {
    displayName: 'Badges';
    icon: 'bulletList';
  };
  attributes: {
    alt: Schema.Attribute.String;
    Badge: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

export interface GalleryTypes extends Struct.ComponentSchema {
  collectionName: 'components_gallery_types';
  info: {
    displayName: 'types';
    icon: 'apps';
  };
  attributes: {
    label: Schema.Attribute.String;
    type: Schema.Attribute.String;
  };
}

export interface OurServicesOurServiceComponent extends Struct.ComponentSchema {
  collectionName: 'components_our_services_our_service_components';
  info: {
    description: '';
    displayName: 'OurServiceComponent';
    icon: 'car';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    label: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
  };
}

export interface TvsizesTvsizes extends Struct.ComponentSchema {
  collectionName: 'components_tvsizes_tvsizes';
  info: {
    description: '';
    displayName: 'tvsizes';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.String;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'badges.badges': BadgesBadges;
      'gallery.types': GalleryTypes;
      'our-services.our-service-component': OurServicesOurServiceComponent;
      'tvsizes.tvsizes': TvsizesTvsizes;
    }
  }
}
