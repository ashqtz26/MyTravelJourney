
// =====================================
// SUPABASE CONFIGURATION
// =====================================

const SUPABASE_URL = "https://biadagfpzeernbtfjufl.supabase.co";
const SUPABASE_KEY = "sb_publishable_53z7SZKnakm9o-tn0vU9Lg_k13sQL8W";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =====================================
// HTML ELEMENTS
// =====================================

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const destinationSelect =
    document.getElementById("destinationSelect");

const photoFiles = document.getElementById("photoFiles");
const captionInput = document.getElementById("caption");

const uploadBtn = document.getElementById("uploadBtn");

const loginMessage = document.getElementById("loginMessage");
const uploadMessage = document.getElementById("uploadMessage");

const adminGallery = document.getElementById("adminGallery");

const BUCKET = "travel-photos";

// =====================================
// LOGIN
// =====================================

loginBtn.addEventListener("click", login);

async function login() {

    loginMessage.textContent = "Logging in...";

    const { data, error } = await supabaseClient.auth
        .signInWithPassword({
            email: emailInput.value.trim(),
            password: passwordInput.value
        });

    if (error) {
        loginMessage.textContent = error.message;
        return;
    }

    showDashboard();
}

// =====================================
// AUTHENTICATION
// =====================================

async function showDashboard() {

    loginSection.hidden = true;
    dashboard.hidden = false;

    await loadDestinations();
    await loadAdminPhotos();
}

logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    dashboard.hidden = true;
    loginSection.hidden = false;
});

// Check existing login
async function checkLogin() {

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        showDashboard();
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

    console.log("Destinations loaded:", data);
}

// =====================================
// UPLOAD PHOTOS
// =====================================

uploadBtn.addEventListener("click", uploadPhotos);

async function uploadPhotos() {

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

    uploadBtn.disabled = true;

    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {

        const file = files[i];

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const filePath =
            `${destinationId}/${Date.now()}-${i}-${safeName}`;

        uploadMessage.textContent =
            `Uploading ${i + 1} of ${files.length}...`;

        // Upload actual image to Storage
        const { error: storageError } =
            await supabaseClient.storage
                .from(BUCKET)
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false
                });

        if (storageError) {
            console.error(storageError);
            uploadMessage.textContent =
                "Storage upload failed: " + storageError.message;
            break;
        }

        // Save photo information to database
        const { error: databaseError } = await supabaseClient
            .from("destination_photos")
            .insert({
                destination_id: Number(destinationId),
                image_path: filePath,
                caption: caption
            });

        if (databaseError) {

            // Remove image if database saving fails
            await supabaseClient.storage
                .from(BUCKET)
                .remove([filePath]);

            console.error(databaseError);

            uploadMessage.textContent =
                "Database saving failed: " + databaseError.message;

            break;
        }

        uploadedCount++;
    }

    uploadBtn.disabled = false;

    if (uploadedCount > 0) {
        uploadMessage.textContent =
            `Successfully uploaded ${uploadedCount} photo(s)!`;

        photoFiles.value = "";
        captionInput.value = "";

        await loadAdminPhotos();
    }
}

// =====================================
// LOAD UPLOADED PHOTOS
// =====================================

async function loadAdminPhotos() {

    adminGallery.innerHTML = "Loading photos...";

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
        return;
    }

    adminGallery.innerHTML = "";

    if (!data.length) {
        adminGallery.textContent = "No photos uploaded yet.";
        return;
    }

    data.forEach(photo => {

        const { data: publicData } = supabaseClient.storage
            .from(BUCKET)
            .getPublicUrl(photo.image_path);

        const card = document.createElement("div");
        card.className = "photo-card";

        const img = document.createElement("img");
        img.src = publicData.publicUrl;
        img.alt = photo.caption || "Travel photo";

        const info = document.createElement("p");
        info.textContent =
            `${photo.destinations?.name || "Destination"} - ${photo.caption || "No caption"}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "DELETE";

        deleteBtn.addEventListener("click", () => {
            deletePhoto(photo.id, photo.image_path);
        });

        card.append(img, info, deleteBtn);
        adminGallery.appendChild(card);
    });
}

// =====================================
// DELETE PHOTOS
// =====================================

async function deletePhoto(id, imagePath) {

    if (!confirm("Are you sure you want to delete this photo?")) {
        return;
    }

    const { error: storageError } = await supabaseClient.storage
        .from(BUCKET)
        .remove([imagePath]);

    if (storageError) {
        alert("Could not delete image: " + storageError.message);
        return;
    }

    const { error: databaseError } = await supabaseClient
        .from("destination_photos")
        .delete()
        .eq("id", id);

    if (databaseError) {
        alert("Could not delete photo record: " + databaseError.message);
        return;
    }

    alert("Photo deleted successfully!");

    await loadAdminPhotos();
}
