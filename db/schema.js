var mongoose = require("mongoose");
const UserSchema = () => {
  let schema = new mongoose.Schema({
    id: Object,
    fullName: String,
    phone: String,
    email: String,
    birthDay: String,
    password: String,
    role: String,
    active: Boolean,
    activeCode: Number,
    timeCreate: String,
    avatar: String,
    location: String,
    detailLogin: Object,
    notify: Object,
  });
  let model;

  if (mongoose.models.Users) {
    model = mongoose.model("Users");
  } else {
    model = mongoose.model("Users", schema);
  }
  return model;
};

const UserSchemaV2 = () => {
  let schema = new mongoose.Schema({
    id: Object,
    fullName: String,
    username: String,
    phone: String,
    email: String,
    birthDay: String,
    password: String,
    role: String,
    active: Boolean,
    activeCode: Number,
    timeCreate: String,
    avatar: String,
    location: String,
    detailLogin: Object,
    notify: Object,
    referalFrom: String,
    //zzz
  });
  let model;

  if (mongoose.models.Users) {
    model = mongoose.model("Users");
  } else {
    model = mongoose.model("Users", schema);
  }
  return model;
};

const MineSchemaV2 = () => {
  let schema = new mongoose.Schema({
    email: String,
    coin: String,
    timemining: String,
    caculatetime: String,
    timemineCaculate: String,
    timemineBonus: String,
    coinCaculate: String
    //zzz
  });
  let model;

  if (mongoose.models.Mining) {
    model = mongoose.model("Mining");
  } else {
    model = mongoose.model("Mining", schema);
  }
  return model;
};
const MineHistorySchemaV2 = () => {
  let schema = new mongoose.Schema({
    email: String,
    coin: String,
    timemining: String,
    caculatetime: String,
    timemineCaculate: String,
    timemineBonus: String,
    coinCaculate: String
    //zzz
  });
  let model;

  if (mongoose.models.MineHistory) {
    model = mongoose.model("MineHistory");
  } else {
    model = mongoose.model("MineHistory", schema);
  }
  return model;
};
const MailSchema = () => {
  let schema = new mongoose.Schema({
    from: String,
    to: String,
    title: String,
    description: String,
    image: {
      type: String,
      default: ""
    },
    type: {
      type: Number,
      default: 1
    }, //1:info, 2:warning, 3:error
    isReaded: Boolean,
    timeSend: {
      type: Number,
      default: new Date().getTime()
    },
    active: Boolean
  });
  let model;

  if (mongoose.models.mails) {
    model = mongoose.model("mails");
  } else {
    model = mongoose.model("mails", schema);
  }
  return model;
};
const CollectionSchema = () => {
  let schema = new mongoose.Schema({
    title: {
      type: String,
      default: "title"
    },
    String,
    description: {
      type: String,
      default: "default"
    },
    img: String,
    createdBy: String,
    active: Boolean,
    timeCreate: {
      type: Number,
      default: new Date().getTime()
    }
  });
  let model;

  if (mongoose.models.Collections) {
    model = mongoose.model("Collections");
  } else {
    model = mongoose.model("Collections", schema);
  }
  return model;
};
var commentSchema = () => {
  let schema = new Schema({
    byUser: String,

    timeCreate: {
      type: Number,
      default: new Date().getTime()
    },
    comment: String,
    like: {
      type: Boolean,
      default: false
    }
  });
  let model;

  if (mongoose.models.comments) {
    model = mongoose.model("comments");
  } else {
    model = mongoose.model("comments", schema);
  }
  return model;
};
var reportSchema = () => {
  let schema = new Schema({
    byEmail: String,
    typeReport: Number, //1:news/2:comment
    timeCreate: {
      type: Number,
      default: new Date().getTime()
    },

    report: String
  });
  if (mongoose.models.reports) {
    model = mongoose.model("reports");
  } else {
    model = mongoose.model("reports", schema);
  }
  return model;
};

const NewSchema = () => {
  let schema = new mongoose.Schema({
    arrImage: { type: Object, default: [] },
    title: String,
    description: String,

    infoAddress: String,
    address: String,

    allowUserFollowSee: {
      type: Boolean,
      default: false
    },
    userId: {
      type: Object,
      default: {},
      required: true
    },
    collectionId: {
      type: Object,
      default: {},
      required: true
    },
    provinceId: String,
    province: String,
    districId: String,
    distric: String,

    isHidden: {
      type: Boolean,
      default: false
    },
    timeCreate: {
      type: Number,
      default: new Date().getTime()
    },
    isReview: {
      type: Number,
      default: 2 //0:isReviewed /1:isReviewing /2:waitingForReview
    },
    reviewStatus: {
      type: String,
      default: ""
    }
  });
  let model;

  if (mongoose.models.News) {
    model = mongoose.model("News");
  } else {
    model = mongoose.model("News", schema);
  }
  return model;
};
module.exports = {
  UserSchema,
  MailSchema,
  CollectionSchema,
  NewSchema,

  UserSchemaV2,
  MineSchemaV2,
  MineHistorySchemaV2
};
