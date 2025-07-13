-- Create keyspace
CREATE KEYSPACE IF NOT EXISTS youtube_comments_cluster
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

USE youtube_comments_cluster;

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  video_id TEXT,
  user_id TEXT,
  content TEXT,
  likes BIGINT,
  dislikes BIGINT,
  created_at TIMESTAMP,
  parent_comment_id UUID,
  reply_count BIGINT
);

-- Secondary indexes for efficient querying
CREATE INDEX IF NOT EXISTS comments_video_id_idx ON comments (video_id);
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments (created_at);