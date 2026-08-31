use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc::{self, Receiver, Sender};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QueueJob {
    pub job_id: Uuid,
    pub document_id: Uuid,
    pub title: String,
    pub raw_content: String,
    pub enqueued_at: DateTime<Utc>,
}

impl QueueJob {
    pub fn new(document_id: Uuid, title: String, raw_content: String) -> Self {
        Self {
            job_id: Uuid::new_v4(),
            document_id,
            title,
            raw_content,
            enqueued_at: Utc::now(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct QueueDispatcher {
    sender: Sender<QueueJob>,
}

impl QueueDispatcher {
    pub fn new(buffer: usize) -> (Self, Receiver<QueueJob>) {
        let (sender, receiver) = mpsc::channel(buffer);
        (Self { sender }, receiver)
    }

    pub fn dispatch(&self, job: QueueJob) -> Result<(), String> {
        self.sender
            .try_send(job)
            .map_err(|e| format!("Failed to dispatch job to queue: {}", e))
    }
}
