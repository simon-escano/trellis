use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc::{self, Receiver, Sender};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueJob {
    pub job_id: Uuid,
    pub document_id: Uuid,
    pub title: String,
    pub raw_content: String,
    pub enqueued_at: DateTime<Utc>,
}

#[derive(Clone, Debug)]
pub struct QueueDispatcher {
    sender: Sender<QueueJob>,
}

impl QueueDispatcher {
    pub fn new(sender: Sender<QueueJob>) -> Self {
        Self { sender }
    }

    pub async fn dispatch_job(&self, job: QueueJob) -> Result<String, String> {
        let job_id_str = job.job_id.to_string();
        self.sender
            .send(job)
            .await
            .map_err(|e| format!("Failed to enqueue job: {}", e))?;
        Ok(job_id_str)
    }

    pub fn try_dispatch_job(&self, job: QueueJob) -> Result<String, String> {
        let job_id_str = job.job_id.to_string();
        self.sender
            .try_send(job)
            .map_err(|e| format!("Failed to enqueue job: {}", e))?;
        Ok(job_id_str)
    }
}

pub fn create_queue_dispatcher(buffer: usize) -> (QueueDispatcher, Receiver<QueueJob>) {
    let (tx, rx) = mpsc::channel(buffer);
    (QueueDispatcher::new(tx), rx)
}
