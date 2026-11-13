const env = import.meta.env

const value = (key, fallback = '') => env[key] || fallback

export const API_URL = value('VITE_API_URL', '/api')

export const appConfig = {
  name: value('VITE_APP_NAME', 'Lapreh Creations'),
  tagline: value('VITE_APP_TAGLINE', 'Ethnic wear boutique'),
  description: value(
    'VITE_APP_DESCRIPTION',
    'Thoughtfully crafted ethnic wear for celebrations, everyday elegance, and everything in between.',
  ),
  foundedYear: value('VITE_APP_FOUNDED_YEAR', '2018'),
  supportHours: value('VITE_SUPPORT_HOURS', '11 AM - 7 PM'),
  contact: {
    email: value('VITE_CONTACT_EMAIL', 'hello@laprehcreations.com'),
    phoneDisplay: value('VITE_CONTACT_PHONE_DISPLAY', '+91 92892 91119'),
    phoneTel: value('VITE_CONTACT_PHONE_TEL', '+919289291119'),
    whatsappPrimaryDisplay: value('VITE_WHATSAPP_PRIMARY_DISPLAY', '+91 92892 91119'),
    whatsappSecondaryDisplay: value('VITE_WHATSAPP_SECONDARY_DISPLAY', '+91 92892 91119'),
    whatsappOrderUrl: value('VITE_WHATSAPP_ORDER_URL', 'https://wa.link/1fkdtl'),
    whatsappChatUrl: value('VITE_WHATSAPP_CHAT_URL', 'https://api.whatsapp.com/send?phone=919289291119'),
  },
  links: {
    instagram: value('VITE_INSTAGRAM_URL', 'https://instagram.com'),
    facebook: value('VITE_FACEBOOK_URL', 'https://facebook.com'),
    maps: value('VITE_MAPS_URL', 'https://maps.google.com'),
    razorpayCheckout: value('VITE_RAZORPAY_CHECKOUT_URL', 'https://checkout.razorpay.com/v1/checkout.js'),
  },
  stores: [
    {
      name: value('VITE_STORE_1_NAME', 'Lapreh Creations Pitampura'),
      address: value('VITE_STORE_1_ADDRESS', 'Store no. 6, Shiva Enclave, Pitampura, New Delhi 110034'),
    },
    {
      name: value('VITE_STORE_2_NAME', 'Lapreh Creations Gurgaon'),
      address: value('VITE_STORE_2_ADDRESS', '4008, Galleria Market, DLF Phase IV, Sector 28, Gurgaon 122009'),
    },
    {
      name: value('VITE_STORE_3_NAME', 'Lapreh Creations Mumbai'),
      address: value('VITE_STORE_3_ADDRESS', 'Linking Rd, Khar, Bandra West, Mumbai 400050'),
    },
  ].filter((store) => store.name && store.address),
}
