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

export interface BlocksAboutUs extends Struct.ComponentSchema {
  collectionName: 'components_blocks_about_uses';
  info: {
    displayName: 'About Us';
    icon: 'eye';
  };
  attributes: {
    mainTextLeft: Schema.Attribute.Text;
    mainTextRight: Schema.Attribute.Text;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksCertificate extends Struct.ComponentSchema {
  collectionName: 'components_blocks_certificates';
  info: {
    displayName: 'Certificate';
    icon: 'briefcase';
  };
  attributes: {
    certificates: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksContactUs extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_uses';
  info: {
    displayName: 'Contact Us';
    icon: 'message';
  };
  attributes: {
    facebook: Schema.Attribute.Text;
    instagram: Schema.Attribute.Text;
    pinterest: Schema.Attribute.Text;
    subTitle: Schema.Attribute.Text;
    thumbtack: Schema.Attribute.Text;
    tiktok: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    x: Schema.Attribute.Text;
    yelp: Schema.Attribute.Text;
    youtube: Schema.Attribute.Text;
  };
}

export interface BlocksCustomerReviews extends Struct.ComponentSchema {
  collectionName: 'components_blocks_customer_reviews';
  info: {
    displayName: 'Customer Reviews';
    icon: 'heart';
  };
  attributes: {
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksFaq extends Struct.ComponentSchema {
  collectionName: 'components_blocks_faqs';
  info: {
    displayName: 'FAQ';
    icon: 'question';
  };
  attributes: {
    faqs: Schema.Attribute.Component<'faq.faqs', true>;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksGalleryOfWork extends Struct.ComponentSchema {
  collectionName: 'components_blocks_gallery_of_works';
  info: {
    displayName: 'Gallery Of Work';
    icon: 'bulletList';
  };
  attributes: {
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    types: Schema.Attribute.Component<'gallery.types', true>;
  };
}

export interface BlocksHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_heroes';
  info: {
    displayName: 'Hero';
    icon: 'crown';
  };
  attributes: {
    badges: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    video: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface BlocksOurServices extends Struct.ComponentSchema {
  collectionName: 'components_blocks_our_services';
  info: {
    displayName: 'Our Services';
    icon: 'store';
  };
  attributes: {
    services: Schema.Attribute.Component<
      'our-services.our-service-component',
      true
    >;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksSeeOurWorkInAction extends Struct.ComponentSchema {
  collectionName: 'components_blocks_see_our_work_in_actions';
  info: {
    displayName: 'See Our Work in Action';
    icon: 'cast';
  };
  attributes: {
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    videoItem: Schema.Attribute.Component<'video-block.video-item', true>;
  };
}

export interface BlocksTvMountingTypes extends Struct.ComponentSchema {
  collectionName: 'components_blocks_tv_mounting_types';
  info: {
    displayName: 'TV Mounting Types';
    icon: 'television';
  };
  attributes: {
    addons: Schema.Attribute.Component<'tv-mounting-types.add-ons', true>;
    mountingTypes: Schema.Attribute.Component<'tvsizes.tvsizes', true>;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
  };
}

export interface BlocksTvSizes extends Struct.ComponentSchema {
  collectionName: 'components_blocks_tv_sizes';
  info: {
    displayName: 'TV Sizes';
    icon: 'crop';
  };
  attributes: {
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    tvsizes: Schema.Attribute.Component<'tvsizes.tvsizes', true>;
  };
}

export interface BlocksWhyCustomersChooseUs extends Struct.ComponentSchema {
  collectionName: 'components_blocks_why_customers_choose_uses';
  info: {
    displayName: 'Why Customers Choose Us';
    icon: 'cup';
  };
  attributes: {
    cards: Schema.Attribute.Component<'tvsizes.tvsizes', true>;
    subTitle: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
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

export interface GlobalSeo extends Struct.ComponentSchema {
  collectionName: 'components_global_seos';
  info: {
    description: '';
    displayName: 'seo';
    icon: 'gate';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.Text;
    shareImage: Schema.Attribute.Text;
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

export interface TvsizesTest extends Struct.ComponentSchema {
  collectionName: 'components_tvsizes_tests';
  info: {
    displayName: 'test';
    icon: 'phone';
  };
  attributes: {
    test: Schema.Attribute.Text;
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

export interface VideoBlockVideoItem extends Struct.ComponentSchema {
  collectionName: 'components_video_block_video_items';
  info: {
    displayName: 'video-item';
    icon: 'eye';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.Text;
    youtubeId: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'badges.badges': BadgesBadges;
      'blocks.about-us': BlocksAboutUs;
      'blocks.certificate': BlocksCertificate;
      'blocks.contact-us': BlocksContactUs;
      'blocks.customer-reviews': BlocksCustomerReviews;
      'blocks.faq': BlocksFaq;
      'blocks.gallery-of-work': BlocksGalleryOfWork;
      'blocks.hero': BlocksHero;
      'blocks.our-services': BlocksOurServices;
      'blocks.see-our-work-in-action': BlocksSeeOurWorkInAction;
      'blocks.tv-mounting-types': BlocksTvMountingTypes;
      'blocks.tv-sizes': BlocksTvSizes;
      'blocks.why-customers-choose-us': BlocksWhyCustomersChooseUs;
      'faq.faqs': FaqFaqs;
      'gallery.types': GalleryTypes;
      'global.seo': GlobalSeo;
      'our-services.our-service-component': OurServicesOurServiceComponent;
      'tv-mounting-types.add-ons': TvMountingTypesAddOns;
      'tvsizes.test': TvsizesTest;
      'tvsizes.tvsizes': TvsizesTvsizes;
      'video-block.video-item': VideoBlockVideoItem;
    }
  }
}
