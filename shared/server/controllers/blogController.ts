import { Request, Response } from "express";
import { storage } from "../storage";
import { insertBlogPostSchema } from "@shared/schema";
import { z } from "zod";

// Validation schemas
const getBlogPostsSchema = z.object({
  published: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

const blogPostIdSchema = z.object({
  id: z.coerce.number().min(1),
});

const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  related_products: z.array(z.number()).optional(),
  published: z.boolean().optional().default(false),
  slug: z.string().optional(),
});

const updateBlogPostSchema = createBlogPostSchema.partial();

class BlogController {
  async getBlogPosts(req: Request, res: Response) {
    try {
      // Validate query parameters
      const validationResult = getBlogPostsSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          message: "Please provide valid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { published, limit, offset } = validationResult.data;

      // For public access, only show published posts unless user is admin
      // Admin sees all posts if no published filter is specified
      let showPublished;
      if (req.user?.is_admin || (req as any).admin) {
        showPublished = published; // undefined means show all for admin
      } else {
        showPublished = published !== undefined ? published : true; // non-admin only sees published by default
      }

      const result = await storage.getBlogPosts({
        published: showPublished,
        limit,
        offset,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(result.total / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      res.json({
        success: true,
        posts: result.posts.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content.substring(0, 200) + "...", // Preview only
          related_products: post.related_products,
          author_id: post.author_id,
          published: post.published,
          slug: post.slug,
          image_id: post.image_id,
          created_at: post.created_at,
        })),
        pagination: {
          total: result.total,
          page: currentPage,
          totalPages,
          limit,
          offset,
        },
      });

    } catch (error) {
      console.error("Get blog posts error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch blog posts. Please try again.",
      });
    }
  }

  async getBlogPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let post;

      // Try to get by slug first, then by ID
      if (isNaN(Number(id))) {
        // It's a slug
        post = await storage.getBlogPostBySlug(id);
      } else {
        // It's an ID
        const validationResult = blogPostIdSchema.safeParse(req.params);
        if (!validationResult.success) {
          return res.status(400).json({
            error: "Invalid blog post ID",
            message: "Please provide a valid blog post ID",
            details: validationResult.error.errors,
          });
        }
        post = await storage.getBlogPost(Number(id));
      }

      if (!post) {
        return res.status(404).json({
          error: "Blog post not found",
          message: `Blog post with ID ${id} does not exist`,
        });
      }

      // Check if post is published (unless user is admin)
      if (!post.published && !req.user?.is_admin) {
        return res.status(404).json({
          error: "Blog post not found",
          message: "The requested blog post is not available",
        });
      }

      // Get author information
      const author = await storage.getUser(post.author_id);

      // Get related products if any
      let relatedProducts = [];
      if (post.related_products && Array.isArray(post.related_products)) {
        for (const productId of post.related_products) {
          if (typeof productId === "number") {
            const product = await storage.getProduct(productId);
            if (product) {
              relatedProducts.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
              });
            }
          }
        }
      }

      res.json({
        success: true,
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          author: author ? {
            first_name: author.first_name,
            username: author.username,
          } : null,
          related_products: relatedProducts,
          published: post.published,
          slug: post.slug,
          image_id: post.image_id,
          created_at: post.created_at,
        },
      });

    } catch (error) {
      console.error("Get blog post error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to fetch blog post. Please try again.",
      });
    }
  }

  async createBlogPost(req: Request, res: Response) {
    try {
      // AdminAuthMiddleware already ensures admin access

      // Validate request body
      console.log("createBlogPost - Validating request body");
      const validationResult = createBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("createBlogPost - Validation failed:", validationResult.error.errors);
        return res.status(400).json({
          error: "Invalid blog post data",
          message: "Please provide valid blog post information",
          details: validationResult.error.errors,
        });
      }

      const { title, content, related_products, published, slug } = validationResult.data;

      // Validate related products if provided
      if (related_products && Array.isArray(related_products)) {
        for (const productId of related_products) {
          if (typeof productId === "number") {
            const product = await storage.getProduct(productId);
            if (!product) {
              return res.status(400).json({
                error: "Invalid related product",
                message: `Product with ID ${productId} does not exist`,
              });
            }
          }
        }
      }

      // Get admin ID - works with both auth middlewares
      const authorId = (req as any).admin?.id || req.user?.id;
      if (!authorId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Admin authentication required",
        });
      }

      // Create blog post data with author_id and slug
      const blogPostData = {
        title,
        content,
        related_products: related_products || null,
        author_id: 1, // Используем админского пользователя как автора всех блог-статей
        published: published || false,
        slug: slug || null,
      };

      const post = await storage.createBlogPost(blogPostData as any);

      res.status(201).json({
        success: true,
        message: "Blog post created successfully",
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          related_products: post.related_products,
          author_id: post.author_id,
          published: post.published,
          created_at: post.created_at,
        },
      });

    } catch (error: any) {
      console.error("Create blog post error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: "Server error",
        message: "Failed to create blog post. Please try again.",
        details: error.message
      });
    }
  }

  async updateBlogPost(req: Request, res: Response) {
    try {
      // AdminAuthMiddleware already ensures admin access

      // Validate blog post ID
      const idValidation = blogPostIdSchema.safeParse(req.params);
      if (!idValidation.success) {
        return res.status(400).json({
          error: "Invalid blog post ID",
          message: "Please provide a valid blog post ID",
        });
      }

      const { id } = idValidation.data;

      // Check if post exists
      const existingPost = await storage.getBlogPost(id);
      if (!existingPost) {
        return res.status(404).json({
          error: "Blog post not found",
          message: `Blog post with ID ${id} does not exist`,
        });
      }

      // Validate request body
      const validationResult = updateBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid update data",
          message: "Please provide valid blog post information",
          details: validationResult.error.errors,
        });
      }

      const updateData = validationResult.data;

      // Validate related products if provided
      if (updateData.related_products && Array.isArray(updateData.related_products)) {
        for (const productId of updateData.related_products) {
          if (typeof productId === "number") {
            const product = await storage.getProduct(productId);
            if (!product) {
              return res.status(400).json({
                error: "Invalid related product",
                message: `Product with ID ${productId} does not exist`,
              });
            }
          }
        }
      }

      const updatedPost = await storage.updateBlogPost(id, updateData);

      if (!updatedPost) {
        return res.status(500).json({
          error: "Update failed",
          message: "Failed to update blog post. Please try again.",
        });
      }

      res.json({
        success: true,
        message: "Blog post updated successfully",
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          content: updatedPost.content,
          related_products: updatedPost.related_products,
          author_id: updatedPost.author_id,
          published: updatedPost.published,
          created_at: updatedPost.created_at,
        },
      });

    } catch (error) {
      console.error("Update blog post error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to update blog post. Please try again.",
      });
    }
  }

  async deleteBlogPost(req: Request, res: Response) {
    try {
      // Get admin ID - works with both auth middlewares
      const adminId = (req as any).admin?.id || req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          error: "Authentication required",
          message: "Admin authentication required to delete blog posts",
        });
      }

      // AdminAuthMiddleware already ensures admin access

      // Validate blog post ID
      const validationResult = blogPostIdSchema.safeParse(req.params);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid blog post ID",
          message: "Please provide a valid blog post ID",
        });
      }

      const { id } = validationResult.data;

      // Check if post exists
      const existingPost = await storage.getBlogPost(id);
      if (!existingPost) {
        return res.status(404).json({
          error: "Blog post not found",
          message: `Blog post with ID ${id} does not exist`,
        });
      }

      const deleted = await storage.deleteBlogPost(id);

      if (!deleted) {
        return res.status(500).json({
          error: "Delete failed",
          message: "Failed to delete blog post. Please try again.",
        });
      }

      res.json({
        success: true,
        message: "Blog post deleted successfully",
      });

    } catch (error) {
      console.error("Delete blog post error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Failed to delete blog post. Please try again.",
      });
    }
  }
}

export const blogController = new BlogController();
