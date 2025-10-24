export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  cover_url?: string;
  repo_url?: string;
  demo_url?: string;
  published: boolean;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  cover_url?: string;
  repo_url?: string;
  demo_url?: string;
  published: boolean;
  owner: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}
