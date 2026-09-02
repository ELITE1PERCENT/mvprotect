/**
 * Stockage objet adossé à Tigris (S3-compatible), hébergé à côté de l'app
 * Fly.io. Remplace l'ancien Replit Object Storage, qui dépendait d'un sidecar
 * local (127.0.0.1:1106) inexistant sur Fly.
 *
 * Secrets attendus sur l'app :
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY — identifiants Tigris
 *   AWS_ENDPOINT_URL_S3                       — ex. https://fly.storage.tigris.dev
 *   AWS_REGION                                — ex. auto
 *   BUCKET_NAME                               — ex. mvprotect-uploads
 *
 * Tous les objets vivent sous le préfixe `uploads/` et sont adressés par un
 * UUID v4. L'identifiant étant validé strictement avant toute construction de
 * clé, aucun chemin fourni par le client ne peut sortir de ce préfixe.
 */
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

/** Préfixe unique sous lequel toutes les images sont stockées. */
export const UPLOAD_PREFIX = "uploads/";

/** UUID v4 canonique, en minuscules ou majuscules — rien d'autre. */
const OBJECT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} n'est pas défini — configurez le bucket Tigris ` +
        `(fly secrets set ${name}=...)`,
    );
  }
  return value;
}

// Client créé à la première utilisation : le serveur doit pouvoir démarrer
// (healthcheck compris) même si les secrets de stockage manquent.
let client: S3Client | undefined;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env["AWS_REGION"] ?? "auto",
      endpoint: requireEnv("AWS_ENDPOINT_URL_S3"),
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

function bucket(): string {
  return requireEnv("BUCKET_NAME");
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    e?.name === "NoSuchKey" ||
    e?.name === "NotFound" ||
    e?.$metadata?.httpStatusCode === 404
  );
}

/** Objet lu depuis Tigris : le corps reste un flux, jamais bufferisé. */
export interface StoredObject {
  stream: Readable;
  contentType: string;
  contentLength: number | undefined;
  etag: string | undefined;
}

export class ObjectStorageService {
  /** Nouvel identifiant d'objet (UUID v4). */
  newObjectId(): string {
    return randomUUID();
  }

  /** Vrai uniquement pour un UUID v4 canonique. */
  isValidObjectId(id: string): boolean {
    return OBJECT_ID_RE.test(id);
  }

  /** Clé S3 d'un objet. Rejette tout identifiant non conforme. */
  objectKey(id: string): string {
    if (!this.isValidObjectId(id)) {
      throw new ObjectNotFoundError();
    }
    return `${UPLOAD_PREFIX}${id.toLowerCase()}`;
  }

  /** Chemin public de service d'un objet (stocké en base comme imageUrl). */
  publicPath(id: string): string {
    return `/api/objects/${UPLOAD_PREFIX}${id.toLowerCase()}`;
  }

  async uploadObject(
    id: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: this.objectKey(id),
        Body: body,
        ContentLength: body.length,
        ContentType: contentType,
      }),
    );
  }

  /**
   * Récupère un objet en streaming.
   * @throws ObjectNotFoundError si l'identifiant est invalide ou absent.
   */
  async getObject(id: string): Promise<StoredObject> {
    const key = this.objectKey(id);

    let output: GetObjectCommandOutput;
    try {
      output = await s3().send(
        new GetObjectCommand({ Bucket: bucket(), Key: key }),
      );
    } catch (err: unknown) {
      if (isNotFound(err)) {
        throw new ObjectNotFoundError();
      }
      throw err;
    }

    if (!output.Body) {
      throw new ObjectNotFoundError();
    }

    return {
      stream: output.Body as Readable,
      contentType: output.ContentType ?? "application/octet-stream",
      contentLength: output.ContentLength,
      etag: output.ETag,
    };
  }
}
