use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString, Error},
    Argon2
};
use wasm_bindgen::prelude::*;

#[worker::event(fetch)]
async fn main(_: worker::Request, _env: worker::Env, _ctx: worker::Context) -> worker::Result<worker::Response> {
    worker::Response::ok("argon2 service")
}

#[wasm_bindgen]
pub fn hash(input: &str) -> Result<String, JsValue> {
    let argon2 = Argon2::default();
    let salt = SaltString::generate(&mut OsRng);

    match argon2.hash_password(input.as_bytes(), &salt) {
        Ok(password_hash) => Ok(password_hash.to_string()),
        Err(err) => Err(JsValue::from_str(&err.to_string())),
    }
}

#[wasm_bindgen]
pub fn verify(hash: &str, input: &str) -> Result<bool, JsValue> {
    let argon2 = Argon2::default();

    match PasswordHash::new(hash) {
        Ok(parsed_hash) => match argon2.verify_password(input.as_bytes(), &parsed_hash) {
            Ok(()) => Ok(true),
            Err(Error::Password) => Ok(false), // Incorrect password
            Err(err) => Err(JsValue::from_str(&err.to_string())), // Other errors
        },
        Err(err) => Err(JsValue::from_str(&err.to_string())),
    }
}
