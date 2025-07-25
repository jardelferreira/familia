function getSalt() {
    return "segredos";
}

async function fecthSalt() {
    salt = getSalt();
    if (!salt) {
        await fetch('https://api.example.com/salt');
    }
    return salt || false;
}
function strToArrayBuffer(str) {
    return new TextEncoder().encode(str);
}

function arrayBufferToStr(buffer) {
    return new TextDecoder().decode(buffer);
}

// Gera uma chave a partir do salt
async function generateKey(salt) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        strToArrayBuffer(salt),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: strToArrayBuffer(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Criptografar
async function encrypt(text) {
    const salt = getSalt();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Vetor de inicialização (requerido no AES-GCM)
    const key = await generateKey(salt);
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        strToArrayBuffer(text)
    );

    // Retorna criptografia base64 + IV para poder reverter depois
    return `${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}.${btoa(String.fromCharCode(...iv))}`;

}

// Descriptografar
async function decrypt(cipherIV) {
    const salt = getSalt()
    const [cipherBase64, ivBase64] = cipherIV.split(".");

    if (!cipherBase64 || !ivBase64) {
        throw new Error("Formato inválido de dados criptografados");
    }
    const encryptedData = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const key = await generateKey(salt);
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
    );
    return arrayBufferToStr(decrypted);
}
/* Exemplo de uso
(async () => {
  const salt = "meu_salt_secreto";
  const texto = "Texto sensível para encriptar";

  const { cipher, iv } = await encrypt(texto, salt);
  console.log("Criptografado:", cipher);
  console.log("IV:", iv);

  const textoOriginal = await decrypt(cipher, salt, iv);
  console.log("Descriptografado:", textoOriginal);
})();
*/
export { encrypt, decrypt };