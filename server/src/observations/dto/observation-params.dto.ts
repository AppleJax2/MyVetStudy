import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO for route parameters when accessing a specific observation
 */
export class ObservationParamsDto {
  /**
   * ID of the observation
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Invalid observation ID format' })
  observationId: string;
} 