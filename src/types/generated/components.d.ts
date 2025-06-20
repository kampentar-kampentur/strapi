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

export interface TvsizesTvsizes extends Struct.ComponentSchema {
  collectionName: 'components_tvsizes_tvsizes';
  info: {
    displayName: 'tvsizes';
    icon: 'bulletList';
  };
  attributes: {
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    label: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'badges.badges': BadgesBadges;
      'tvsizes.tvsizes': TvsizesTvsizes;
    }
  }
}
