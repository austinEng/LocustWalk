import mongoose from 'mongoose';
import slugs from 'slugs';



const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  contentMD: {
    type: String,
<<<<<<< HEAD
    required: true,
=======
    required: false,
>>>>>>> added the form to the admin page, added the model of static content and then also had a preview option
  },
  contentHTML:{
    type: String,
    required: false,
  },


});

module.exports = mongoose.model('StaticContent', Schema);
