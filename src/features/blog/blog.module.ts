import { Module } from '@nestjs/common';
import { AuthModule } from '../../features/auth/auth.module';
import { DatabaseModule } from '../../core/database/database.module';
import { StorageModule } from '../../core/storage/storage.module';
import { BLOG_CREATOR } from './application/ports/blog-creator.port';
import { BLOG_IMAGE_STORAGE } from './application/ports/blog-image-storage.port';
import { CreateBlogUseCase } from './application/use-cases/create-blog.use-case';
import { PostgresBlogCreator } from './infrastructure/persistence/postgres-blog-creator';
import { GcsBlogImageStorage } from './infrastructure/storage/gcs-blog-image-storage';
import { BLOG_READER } from './application/ports/blog-reader.port';
import { PostgresBlogReader } from './infrastructure/persistence/postgres-blog-reader';
import { BlogController } from './presentation/blog.controller';
import { ListBlogsUseCase } from './application/use-cases/list-blogs.use-case';
import { GetBlogImageUseCase } from './application/use-cases/get-blog-image.use-case';
import { GcsBlogImageUrlSigner } from './infrastructure/storage/gcs-blog-image-url-signer';
import { BLOG_IMAGE_URL_SIGNER } from './application/ports/blog-image-url-signer.port';
import { ConfigService } from '@nestjs/config';
import { EnvVariable } from '../../core/config/env-variable';
import { LocalBlogImageUrlSigner } from './infrastructure/storage/local-blog-image-url-signer';
import { Environment } from '../../core/config/environment';
import { InMemoryBlogFeedEventBus } from './infrastructure/events/in-memory-blog-feed-event-bus';
import { BLOG_FEED_EVENT_BUS } from './application/ports/blog-feed-event-bus.port';
import { GetBlogByIdUseCase } from './application/use-cases/get-blog-by-id.use-case';

/**
 * Feature module that wires blog creation into Nest's DI graph.
 */
@Module({
  imports: [AuthModule, DatabaseModule, StorageModule],
  controllers: [BlogController],
  providers: [
    CreateBlogUseCase,
    ListBlogsUseCase,
    GetBlogImageUseCase,
    GcsBlogImageUrlSigner, // Must be provided directly to be conditionally injected by the factory.
    LocalBlogImageUrlSigner, // Must be provided directly to be conditionally injected by the factory.
    GetBlogByIdUseCase,
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
    {
      provide: BLOG_FEED_EVENT_BUS,
      useClass: InMemoryBlogFeedEventBus,
    },
  ],
})
export class BlogModule {}
