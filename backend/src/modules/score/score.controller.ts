import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('score')
@ApiBearerAuth()
@Controller('score')
export class ScoreController {
  // Aquí irán los endpoints para scores
}
