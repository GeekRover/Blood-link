const BlogCard = ({ blog }) => {
  return (
    <div className="blog-card">
      <h3>{blog.title}</h3>
      <p>{blog.excerpt}</p>
      <div className="blog-meta">
        <span>{blog.category}</span>
        <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default BlogCard;
