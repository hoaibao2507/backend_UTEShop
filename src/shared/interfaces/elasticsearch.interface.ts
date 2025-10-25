// Elasticsearch Response Interface
export interface IElasticsearchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Elasticsearch Index Mapping Interface
export interface IndexMapping {
  properties: Record<string, any>;
}

// Elasticsearch Index Settings Interface
export interface IndexSettings {
  analysis?: {
    analyzer?: Record<string, any>;
    filter?: Record<string, any>;
  };
}

// Product Elasticsearch Document Interface
export interface ProductIndexDocument {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  vendorId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Category Elasticsearch Document Interface
export interface CategoryIndexDocument {
  id: number;
  name: string;
  description: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}
