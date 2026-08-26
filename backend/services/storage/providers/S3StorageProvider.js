const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const StorageProvider = require('./StorageProvider');
const fs = require('fs');

/**
 * Провайдер для S3-совместимых хранилищ (AWS, Yandex Object Storage, Selectel и др.)
 */
class S3StorageProvider extends StorageProvider {
  constructor(config) {
    super();
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle || true,
    });
    this.bucket = config.bucket;
  }

  async save(filename, data) {
    let body = data;
    
    // Если это путь к файлу
    if (typeof data === 'string' && fs.existsSync(data)) {
      body = fs.createReadStream(data);
    }

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: filename,
        Body: body,
      },
    });

    await upload.done();
    return { filename, bucket: this.bucket };
  }

  async get(filename) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });
    const response = await this.client.send(command);
    return response.Body;
  }

  async delete(filename) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });
    await this.client.send(command);
  }

  async exists(filename) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      });
      await this.client.send(command);
      return true;
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}

module.exports = S3StorageProvider;
