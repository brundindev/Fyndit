import { Cloudinary } from '@cloudinary/vue';

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: 'dvxe3ihxa' // Sustituye por el nombre de tu cuenta de Cloudinary
  }
});

export default cloudinary;
