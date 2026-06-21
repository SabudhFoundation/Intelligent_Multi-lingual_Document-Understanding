// API wrappers for Multilingual Document Understanding backend

export interface HealthStatus {
  status: string;
  database: string;
  database_type?: string;
}

export interface CsvRecord {
  id: number;
  source_file: string;
  row_number: number;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CsvImportResponse {
  source_file: string;
  inserted: number;
  updated: number;
}

export interface RecordsResponse {
  total: number;
  limit: number;
  offset: number;
  items: CsvRecord[];
}

export interface ChatResponse {
  answer: string;
  source_record_ids: number[];
  used_llm: boolean;
}

export interface ProcessedDocument {
  id: number;
  source_file: string;
  source_path: string;
  document_type: string;
  language: string;
  extracted_text: string;
  masked_text: string;
  english_text: string;
  translation_status: string;
  entities: Record<string, any>;
  features: Record<string, any>;
  summary: string;
  embedding: number[];
  database_path: string;
  vector_index_path: string;
  privacy_vault_path: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessedDocumentsResponse {
  total: number;
  limit: number;
  offset: number;
  items: ProcessedDocument[];
}

const BASE_URL = '/api';

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function uploadCsvFile(file: File): Promise<CsvImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/csv/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload CSV file');
  }

  return res.json();
}

export async function uploadDocument(file: File): Promise<ProcessedDocument> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/document/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload document');
  }

  return res.json();
}

export async function importCsvFromPath(path: string, sourceFile?: string): Promise<CsvImportResponse> {
  const params = new URLSearchParams();
  params.append('path', path);
  if (sourceFile) {
    params.append('source_file', sourceFile);
  }

  const res = await fetch(`${BASE_URL}/csv/import?${params.toString()}`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to import CSV from path');
  }

  return res.json();
}

export async function fetchRecords(
  search?: string,
  sourceFile?: string,
  limit: number = 50,
  offset: number = 0
): Promise<RecordsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (sourceFile) params.append('source_file', sourceFile);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${BASE_URL}/records?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch records');
  return res.json();
}

export async function fetchDocuments(
  search?: string,
  sourceFile?: string,
  limit: number = 50,
  offset: number = 0
): Promise<ProcessedDocumentsResponse> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (sourceFile) params.append('source_file', sourceFile);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${BASE_URL}/documents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch processed documents');
  return res.json();
}

export async function askChat(question: string, limit: number = 8): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, limit }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process chat question');
  }

  return res.json();
}

export async function fetchDocumentById(id: number): Promise<ProcessedDocument> {
  const res = await fetch(`${BASE_URL}/documents/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch document #${id}`);
  }
  return res.json();
}

export async function fetchRecordById(id: number): Promise<CsvRecord> {
  const res = await fetch(`${BASE_URL}/records/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch record #${id}`);
  }
  return res.json();
}
