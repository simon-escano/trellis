use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub is_guest: bool,
    pub exp: usize,
    pub iat: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub is_guest: bool,
}

impl AuthUser {
    pub fn new(id: Uuid, email: String) -> Self {
        Self {
            id,
            email,
            is_guest: false,
        }
    }

    pub fn guest() -> Self {
        Self {
            id: Uuid::nil(),
            email: "guest@trellis.local".to_string(),
            is_guest: true,
        }
    }
}

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("Password hashing failed: {}", e))
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed_hash) => Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok(),
        Err(_) => false,
    }
}

pub fn create_jwt(user_id: Uuid, email: &str, is_guest: bool, secret: &str) -> Result<String, String> {
    let now = chrono::Utc::now().timestamp() as usize;
    let exp = now + (24 * 60 * 60); // 24 hours validity
    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        is_guest,
        exp,
        iat: now,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| format!("JWT encoding error: {}", e))
}

pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, String> {
    let mut validation = Validation::default();
    validation.validate_exp = true;

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|e| format!("JWT validation error: {}", e))
}

pub fn extract_auth_user(auth_header: Option<&str>, secret: &str) -> Option<AuthUser> {
    let header_val = auth_header?;
    let token = if header_val.starts_with("Bearer ") || header_val.starts_with("bearer ") {
        &header_val[7..]
    } else {
        header_val
    };

    if token.trim().is_empty() {
        return None;
    }

    match verify_jwt(token.trim(), secret) {
        Ok(claims) => {
            if let Ok(user_id) = Uuid::parse_str(&claims.sub) {
                Some(AuthUser {
                    id: user_id,
                    email: claims.email,
                    is_guest: claims.is_guest,
                })
            } else {
                None
            }
        }
        Err(_) => None,
    }
}
