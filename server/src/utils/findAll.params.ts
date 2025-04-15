/**
 * Standard parameters for paginated queries.
 * Used across various services for consistent pagination and filtering.
 */
export interface FindAllParams {
  /** Number of items to skip (for pagination) */
  skip?: number;
  
  /** Number of items to take (page size) */
  take?: number;
  
  /** Cursor for cursor-based pagination */
  cursor?: any;
  
  /** Ordering specification */
  orderBy?: any;
}
