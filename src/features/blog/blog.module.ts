import { Module } from '@nestjs/common';
import { AuthModule } from '../../features/auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { BLOG_CREATOR } from './application/ports/blog-creator';
import { BLOG_IMAGE_STORAGE } from './application/ports/blog-image-storage';
import { CreateBlogUseCase } from './application/use-cases/create-blog';
import { PostgresBlogCreator } from './infrastructure/persistence/postgres-blog-creator';
import { GcsBlogImageStorage } from './infrastructure/storage/gcs-blog-image-storage';
import { BLOG_READER } from './application/ports/blog-reader';
import { PostgresBlogReader } from './infrastructure/persistence/postgres-blog-reader';
import { BlogController } from './presentation/blog.controller';
import { ListBlogsByPageUseCase } from './application/use-cases/list-blogs-by-page';
import { GetBlogImageUseCase } from './application/use-cases/get-blog-image-use-case';
import { GcsBlogImageUrlSigner } from './infrastructure/storage/gcs-blog-image-url-signer';
import { BLOG_IMAGE_URL_SIGNER } from './application/ports/blog-image-url-signer';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../core/config/env-variable';
import { LocalBlogImageUrlSigner } from './infrastructure/storage/local-blog-image-url-signer';
import { Environment } from '../../core/config/environment';

/**
 * Feature module that wires blog creation into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule, StorageModule],
  controllers: [BlogController],
  providers: [
    CreateBlogUseCase,
    ListBlogsByPageUseCase,
    GetBlogImageUseCase,
    GcsBlogImageUrlSigner, // Must be provided directly to be conditionally injected by the factory.
    LocalBlogImageUrlSigner, // Must be provided directly to be conditionally injected by the factory.
    {
      provide: BLOG_CREATOR,
      useClass: PostgresBlogCreator,
    },
    {
      provide: BLOG_IMAGE_STORAGE,
      useClass: GcsBlogImageStorage,
    },
    {
      provide: BLOG_READER,
      useClass: PostgresBlogReader,
    },
    {
      provide: BLOG_IMAGE_URL_SIGNER,
      inject: [ConfigService, GcsBlogImageUrlSigner, LocalBlogImageUrlSigner],
      useFactory: (
        configService: ConfigService,
        gcsSigner: GcsBlogImageUrlSigner,
        localSigner: LocalBlogImageUrlSigner,
      ) => {
        const environment = configService.getOrThrow<string>(
          EnvVariable.NodeEnv,
        );

        return environment === Environment.Local.toString()
          ? localSigner
          : gcsSigner;
      },
    },
  ],
})
export class BlogModule {}
