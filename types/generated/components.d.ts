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

export interface FaqFaqs extends Struct.ComponentSchema {
  collectionName: 'components_faq_faqs';
  info: {
    description: '';
    displayName: 'faqs';
    icon: 'apps';
  };
  attributes: {
    answer: Schema.Attribute.Text;
    question: Schema.Attribute.Text;
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

export interface TvMountingTypesAddOns extends Struct.ComponentSchema {
  collectionName: 'components_tv_mounting_types_add_ons';
  info: {
    displayName: 'Add-Ons';
  };
  attributes: {
    label: Schema.Attribute.String;
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
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    price: Schema.Attribute.Integer;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'badges.badges': BadgesBadges;
      'faq.faqs': FaqFaqs;
      'gallery.types': GalleryTypes;
      'our-services.our-service-component': OurServicesOurServiceComponent;
      'tv-mounting-types.add-ons': TvMountingTypesAddOns;
      'tvsizes.tvsizes': TvsizesTvsizes;
    }
  }
}
