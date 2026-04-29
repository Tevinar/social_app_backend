import { Module } from '@nestjs/common';
import { AuthModule } from '../../features/auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { BLOG_CREATOR } from './application/ports/blog-creator';
import { BLOG_IMAGE_STORAGE } from './application/ports/blog-image-storage';
import { CreateBlogUseCase } from './application/use-cases/create-blog';
import { PostgresBlogCreator } from './infrastructure/persistence/postgres-blog-creator';
import { GcsBlogImageStorage } from './infrastructure/storage/gcs-blog-image-storage';

/**
 * Feature module that wires blog creation into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule, StorageModule],
  controllers: [],
  providers: [
    CreateBlogUseCase,
    {
      provide: BLOG_CREATOR,
      useClass: PostgresBlogCreator,
    },
    {
      provide: BLOG_IMAGE_STORAGE,
      useClass: GcsBlogImageStorage,
    },
  ],
  exports: [CreateBlogUseCase],
})
export class BlogModule {}
