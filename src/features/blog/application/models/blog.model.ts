export type BlogRecord = {
  id: string;
  poster: {
    id: string;
    name: string;
  };
  title: string;
  content: string;
  imagePath: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type BlogReadModel = {
  id: string;
  poster: {
    id: string;
    name: string;
  };
  title: string;
  content: string;
  imageUrl: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
};
