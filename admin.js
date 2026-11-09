
// =====================================
// SUPABASE CONFIGURATION
// =====================================

const SUPABASE_URL = "https://biadagfpzeernbtfjufl.supabase.co";
const SUPABASE_KEY = "sb_publishable_53z7SZKnakm9o-tn0vU9Lg_k13sQL8W";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const BUCKET = "travel-photos";

// =====================================
// HTML ELEMENTS
// =====================================

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const destinationSelect = document.getElementById("destinationSelect");

const photoFiles = document.getElementById("photoFiles");
const captionInput = document.getElementById("caption");

const uploadBtn = document.getElementById("uploadBtn");

const loginMessage = document.getElementById("loginMessage");
const uploadMessage = document.getElementById("uploadMessage");

const adminGallery = document.getElementById("adminGallery");

let dashboardLoading = false;
let uploading = false;

// =====================================
// IMAGE COMPRESSION
// =====================================

async function compressImage(file) {

    return new Promise((resolve, reject) => {

        const objectURL = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {

            const MAX_SIZE = 1600;

            let width = img.naturalWidth;
            let height = img.naturalHeight;

            const ratio = Math.min(
                1,
                MAX_SIZE / Math.max(width, height)
            );

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
                URL.revokeObjectURL(objectURL);
                reject(new Error("Canvas is not supported."));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => {

                URL.revokeObjectURL(objectURL);

                if (!blob) {
                    reject(new Error("Image compression failed."));
                    return;
                }

                // Use the actual returned format.
                const extension = blob.type === "image/webp"
                    ? "webp"
                    : "png";

                const compressedFile = new File(
                    [blob],
                    `travel-${Date.now()}.${extension}`,
                    {
                        type: blob.type,
                        lastModified: Date.now()
                    }
                );

                resolve(compressedFile);

            }, "image/webp", 0.78);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            reject(new Error("Unable to read selected image."));
        };

        img.src = objectURL;
    });
}

// =====================================
// HELPER FUNCTIONS
// =====================================

function formatSize(bytes) {

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function createFileName() {

    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random().toString(36).slice(2);
}

// =====================================
// LOGIN
// =====================================

loginBtn.addEventListener("click", login);

async function login() {

    if (loginBtn.disabled) return;

    loginBtn.disabled = true;
    loginMessage.textContent = "Logging in...";

    try {

        const { error } = await supabaseClient.auth
            .signInWithPassword({
                email: emailInput.value.trim(),
                password: passwordInput.value
            });

        if (error) {
            loginMessage.textContent = error.message;
            return;
        }

        await showDashboard();

    } catch (error) {

        loginMessage.textContent = error.message;

    } finally {

        loginBtn.disabled = false;
    }
}

// =====================================
// AUTHENTICATION
// =====================================

async function showDashboard() {

    if (dashboardLoading) return;

    dashboardLoading = true;

    loginSection.hidden = true;
    dashboard.hidden = false;

    try {

        await Promise.all([
            loadDestinations(),
            loadAdminPhotos()
        ]);

    } finally {

        dashboardLoading = false;
    }
}

logoutBtn.addEventListener("click", async () => {

    logoutBtn.disabled = true;

    try {

        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        dashboard.hidden = true;
        loginSection.hidden = false;

        loginMessage.textContent = "";

    } catch (error) {

        alert("Logout failed: " + error.message);

    } finally {

        logoutBtn.disabled = false;
    }
});

// Check existing session
async function checkLogin() {

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Session Error:", error);
        return;
    }

    if (data.session) {
        await showDashboard();
    }
}

checkLogin();

// =====================================
// LOAD DESTINATIONS
// =====================================

async function loadDestinations() {

    destinationSelect.innerHTML =
        '<option value="">Loading destinations...</option>';

    const { data, error } = await supabaseClient
        .from("destinations")
        .select("id, name")
        .order("name");

    if (error) {

        console.error("Destination Error:", error);

        destinationSelect.innerHTML =
            '<option value="">Failed to load destinations</option>';

        uploadMessage.textContent = error.message;

        return;
    }

    if (!data || data.length === 0) {

        destinationSelect.innerHTML =
            '<option value="">No destinations found</option>';

        return;
    }

    destinationSelect.innerHTML =
        '<option value="">Select Destination</option>';

    data.forEach(place => {

        const option = document.createElement("option");

        option.value = place.id;
        option.textContent = place.name;

        destinationSelect.appendChild(option);
    });
}

// =====================================
// UPLOAD PHOTOS
// =====================================

uploadBtn.addEventListener("click", uploadPhotos);

async function uploadPhotos() {

    if (uploading) return;

    const destinationId = destinationSelect.value;
    const files = Array.from(photoFiles.files);
    const caption = captionInput.value.trim();

    if (!destinationId) {
        uploadMessage.textContent = "Please select a destination.";
        return;
    }

    if (files.length === 0) {
        uploadMessage.textContent = "Please select photos.";
        return;
    }

    const invalidFile = files.find(file =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        || file.size > 10 * 1024 * 1024
    );

    if (invalidFile) {

        uploadMessage.textContent =
            "Use JPG, PNG or WebP images up to 10 MB each.";

        return;
    }

    uploading = true;
    uploadBtn.disabled = true;

    let uploadedCount = 0;
    let failedCount = 0;

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {

        for (let i = 0; i < files.length; i++) {

            const originalFile = files[i];

            uploadMessage.textContent =
                `Compressing photo ${i + 1} of ${files.length}...`;

            // Compress image
            const file = await compressImage(originalFile);

            totalOriginalSize += originalFile.size;
            totalCompressedSize += file.size;

            const extension = file.type === "image/webp"
                ? "webp"
                : "png";

            const filePath =
                `${destinationId}/${createFileName()}.${extension}`;

            uploadMessage.textContent =
                `Uploading photo ${i + 1} of ${files.length}...`;

            // Upload optimized image
            const { error: storageError } =
                await supabaseClient.storage
                    .from(BUCKET)
                    .upload(filePath, file, {
                        contentType: file.type,
                        cacheControl: "31536000",
                        upsert: false
                    });

            if (storageError) {

                console.error("Storage Error:", storageError);

                failedCount++;
                continue;
            }

            // Save image information
            const { error: databaseError } = await supabaseClient
                .from("destination_photos")
                .insert({
                    destination_id: Number(destinationId),
                    image_path: filePath,
                    caption: caption
                });

            if (databaseError) {

                // Remove uploaded image if database insert fails
                await supabaseClient.storage
                    .from(BUCKET)
                    .remove([filePath]);

                console.error("Database Error:", databaseError);

                failedCount++;
                continue;
            }

            uploadedCount++;
        }

    } catch (error) {

        console.error("Upload Error:", error);

        uploadMessage.textContent =
            "Upload failed: " + error.message;

    } finally {

        uploading = false;
        uploadBtn.disabled = false;
    }

    // =================================
    // UPLOAD SUMMARY
    // =================================

    if (uploadedCount > 0) {

        const savedPercentage = totalOriginalSize > 0
            ? (
                (1 - totalCompressedSize / totalOriginalSize) * 100
            ).toFixed(1)
            : 0;

        uploadMessage.textContent =
            `Successfully uploaded ${uploadedCount} photo(s). ` +
            `Compressed size: ${formatSize(totalCompressedSize)}. ` +
            `Estimated size reduction: ${savedPercentage}%.` +
            (failedCount > 0 ? ` ${failedCount} failed.` : "");

        photoFiles.value = "";
        captionInput.value = "";

        await loadAdminPhotos();

    } else if (failedCount > 0) {

        uploadMessage.textContent =
            `${failedCount} photo(s) failed to upload. Check the console for details.`;
    }
}

// =====================================
// LOAD ADMIN GALLERY
// =====================================

async function loadAdminPhotos() {

    adminGallery.textContent = "Loading photos...";

    const { data, error } = await supabaseClient
        .from("destination_photos")
        .select(`
            id,
            image_path,
            caption,
            destinations(name)
        `)
        .order("created_at", { ascending: false });

    if (error) {

        adminGallery.textContent = error.message;
        console.error("Gallery Error:", error);

        return;
    }

    adminGallery.innerHTML = "";

    if (!data || data.length === 0) {

        adminGallery.textContent = "No photos uploaded yet.";

        return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach(photo => {

        const { data: publicData } = supabaseClient.storage
            .from(BUCKET)
            .getPublicUrl(photo.image_path);

        const card = document.createElement("div");

        card.className = "photo-card";

        const img = document.createElement("img");

        img.src = publicData.publicUrl;
        img.alt = photo.caption || "Travel photo";

        img.loading = "lazy";
        img.decoding = "async";
        img.fetchPriority = "low";

        const info = document.createElement("p");

        info.textContent =
            `${photo.destinations?.name || "Destination"} - ${photo.caption || "No caption"}`;

        const deleteBtn = document.createElement("button");

        deleteBtn.textContent = "DELETE";

        deleteBtn.addEventListener("click", () => {
            deletePhoto(photo.id, photo.image_path, deleteBtn);
        });

        card.append(img, info, deleteBtn);

        fragment.appendChild(card);
    });

    adminGallery.appendChild(fragment);
}

// =====================================
// DELETE PHOTOS
// =====================================

async function deletePhoto(id, imagePath, button) {

    if (!confirm("Are you sure you want to delete this photo?")) {
        return;
    }

    button.disabled = true;
    button.textContent = "DELETING...";

    try {

        // Remove image from Storage
        const { error: storageError } = await supabaseClient.storage
            .from(BUCKET)
            .remove([imagePath]);

        if (storageError) {
            throw new Error("Could not delete image: " + storageError.message);
        }

        // Remove database record
        const { error: databaseError } = await supabaseClient
            .from("destination_photos")
            .delete()
            .eq("id", id);

        if (databaseError) {
            throw new Error("Could not delete photo record: " + databaseError.message);
        }

        await loadAdminPhotos();

        alert("Photo deleted successfully!");

    } catch (error) {

        console.error("Delete Error:", error);

        alert(error.message);

        button.disabled = false;
        button.textContent = "DELETE";
    }
}
