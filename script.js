
const places = [
    {
        name: "VIETNAM",
        title: "VIETNAM",
        subtitle: "DISCOVER SOUTHEAST ASIA",
        description: "Explore ancient streets, beautiful landscapes, and the unforgettable culture of Vietnam.",
        image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=90"
    },
    {
        name: "BOHOL",
        title: "BOHOL",
        subtitle: "PARADISE IN THE PHILIPPINES",
        description: "Discover tropical beaches, crystal clear waters, and the beautiful Chocolate Hills.",
        image: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=90"
    },
    {
        name: "SIQUIJOR",
        title: "SIQUIJOR",
        subtitle: "THE MYSTICAL ISLAND",
        description: "Experience peaceful beaches, waterfalls, and the magic of island life.",
        image: "LandingPagePhoto/1.jpg"
    },
    {
        name: "ILOILO",
        title: "ILOILO",
        subtitle: "CULTURE AND HERITAGE",
        description: "Experience beautiful heritage sites, local cuisine, and warm hospitality.",
        image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2000&q=90"
    },
    {
        name: "BACOLOD",
        title: "BACOLOD",
        subtitle: "THE CITY OF SMILES",
        description: "Enjoy local food, colorful culture, and the beautiful scenery of Negros.",
        image: "LandingPagePhoto/2.jpg"
    },
    {
        name: "BAGUIO",
        title: "BAGUIO",
        subtitle: "ESCAPE TO THE HIGHLANDS",
        description: "Enjoy cool mountain air, beautiful pine forests, and relaxing scenery.",
        image: "LandingPagePhoto/3.jpg"
    }
];

let current = 0;

const bg = document.getElementById("heroBg");
const title = document.getElementById("heroTitle");
const subtitle = document.getElementById("subtitle");
const desc = document.getElementById("heroDesc");
const label = document.getElementById("destinationLabel");
const counter = document.getElementById("counter");
const progress = document.getElementById("progressBar");
const content = document.querySelector(".hero-content");

function showSlide(index) {
    current = (index + places.length) % places.length;
    const place = places[current];

    content.classList.remove("animate");

    bg.style.opacity = "0";
    setTimeout(() => {
        bg.style.backgroundImage = `url("${place.image}")`;
        bg.style.opacity = "1";

        title.innerHTML = place.title;
        subtitle.textContent = place.subtitle;
        desc.textContent = place.description;
        label.textContent = place.name;
        counter.textContent = `0${current + 1} / 0${places.length}`;
        progress.style.width = `${((current + 1) / places.length) * 100}%`;

        content.classList.add("animate");
    }, 350);
}

document.getElementById("next").addEventListener("click", () => {
    showSlide(current + 1);
});

document.getElementById("prev").addEventListener("click", () => {
    showSlide(current - 1);
});

document.getElementById("exploreBtn").addEventListener("click", () => {
    document.getElementById("destinations").scrollIntoView({
        behavior: "smooth"
    });
});

// Destination cards
const grid = document.getElementById("destinationGrid");

places.forEach((place, index) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
        <img src="${place.image}" alt="${place.name}">
        <div class="card-info">
            <h3>${place.name}</h3>
            <p>${place.subtitle}</p>
        </div>
    `;

    card.addEventListener("click", () => {
        showSlide(index);
        document.getElementById("home").scrollIntoView({
            behavior: "smooth"
        });
    });

    grid.appendChild(card);
});

// Initial slide
showSlide(0);

// Keyboard navigation
document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") showSlide(current + 1);
    if (event.key === "ArrowLeft") showSlide(current - 1);
});


const destinationPhotos = {
    VIETNAM: [
        "Vietnam/1.jpg",
        "Vietnam/2.jpg",
        "Vietnam/3.jpg",
        "Vietnam/4.jpg",
        "Vietnam/5.jpg",
        "Vietnam/6.jpg",
        "Vietnam/7.jpg",
        "Vietnam/8.jpg",
        "Vietnam/9.jpg",
        "Vietnam/10.jpg",
        "Vietnam/11.jpg",
        "Vietnam/12.jpg",
        "Vietnam/13.jpg",
        "Vietnam/14.jpg",
        "Vietnam/15.jpg",
        "Vietnam/16.jpg",
        "Vietnam/17.jpg",
        "Vietnam/18.jpg",
        "Vietnam/19.jpg",
        "Vietnam/20.jpg",
        "Vietnam/21.jpg",
        "Vietnam/22.jpg",
        "Vietnam/23.jpg",
        "Vietnam/24.jpg",
        "Vietnam/25.jpg"
    ],

    BOHOL: [
        "Bohol/1.jpg",
        "Bohol/2.jpg",
        "Bohol/3.jpg",
        "Bohol/4.jpg",
        "Bohol/5.jpg",
        "Bohol/6.jpg"
    ],

    SIQUIJOR: [
        "Siquijor/1.jpg",
        "Siquijor/2.jpg",
        "Siquijor/3.jpg",
        "Siquijor/4.jpg",
        "Siquijor/5.jpg",
        "Siquijor/6.jpg"
    ],

    ILOILO: [
        "Iloilo/1.jpg",
        "Iloilo/2.jpg",
        "Iloilo/3.jpg",
        "Iloilo/4.jpg",
        "Iloilo/5.jpg",
        "Iloilo/6.jpg"
    ],

    BACOLOD: [
        "Bacolod/1.jpg",
        "Bacolod/2.jpg",
        "Bacolod/3.jpg",
        "Bacolod/4.jpg",
        "Bacolod/5.jpg",
        "Bacolod/6.jpg"
    ],

    BAGUIO: [
        "Baguio/1.jpg",
        "Baguio/2.jpg",
        "Baguio/3.jpg",
        "Baguio/4.jpg",
        "Baguio/5.jpg",
        "Baguio/6.jpg"
    ]
};
    

const gallerySection = document.getElementById("travelGallery");
const galleryGrid = document.getElementById("galleryGrid");
const galleryTitle = document.getElementById("galleryTitle");
const galleryDescription = document.getElementById("galleryDescription");

let activePhotos = [];
let activePhoto = 0;


async function openDestinationGallery(name) {

    galleryTitle.textContent = name + " GALLERY";
    galleryDescription.textContent =
        "Explore the beautiful moments and places of " + name + ".";

    galleryGrid.innerHTML = "<p>Loading photos...</p>";

    gallerySection.classList.add("active");

    gallerySection.scrollIntoView({
        behavior: "smooth"
    });

    // Get destination photos from Supabase
    const { data, error } = await supabaseClient
        .from("destination_photos")
        .select(`
            id,
            image_path,
            caption,
            destinations!inner(name)
        `)
        .eq("destinations.name", name)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gallery Error:", error);
        galleryGrid.innerHTML =
            "<p>Unable to load photos. Please try again.</p>";
        return;
    }

    galleryGrid.innerHTML = "";

    if (!data || data.length === 0) {
        galleryGrid.innerHTML =
            "<p>No photos uploaded for this destination yet.</p>";
        activePhotos = [];
        return;
    }

    // Convert Storage paths into public image URLs
    activePhotos = data.map(photo => {
        const { data: publicData } = supabaseClient.storage
            .from("travel-photos")
            .getPublicUrl(photo.image_path);

        return {
            url: publicData.publicUrl,
            caption: photo.caption || ""
        };
    });

    activePhotos.forEach((photo, index) => {

        const item = document.createElement("div");
        item.className = "gallery-item";

        const img = document.createElement("img");
        img.src = photo.url;
        img.alt = photo.caption || name + " travel photo";
        img.loading = "lazy";

        item.appendChild(img);

        if (photo.caption) {
            const caption = document.createElement("p");
            caption.textContent = photo.caption;
            item.appendChild(caption);
        }

        item.addEventListener("click", () => {
            openPhoto(index);
        });

        galleryGrid.appendChild(item);
    });

    console.log(name + " gallery loaded:", data.length);
}


// Connect destination cards
document.querySelectorAll(".card").forEach((card, index) => {
    card.addEventListener("click", () => {
        openDestinationGallery(places[index].name);
    });
});

// Back button
document.getElementById("backGallery").addEventListener("click", () => {
    gallerySection.classList.remove("active");

    document.getElementById("destinations").scrollIntoView({
        behavior: "smooth"
    });
});

// Fullscreen photo viewer
const photoViewer = document.getElementById("photoViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerCaption = document.getElementById("viewerCaption");

function openPhoto(index) {

    activePhoto = index;

    const photo = activePhotos[index];

    viewerImage.src = photo.url;

    viewerCaption.textContent =
        `${galleryTitle.textContent} — PHOTO ${index + 1} / ${activePhotos.length}`;

    photoViewer.classList.add("active");
}


function changePhoto(direction) {
    activePhoto =
        (activePhoto + direction + activePhotos.length) % activePhotos.length;

    openPhoto(activePhoto);
}

document.getElementById("viewerPrev").addEventListener("click", () => {
    changePhoto(-1);
});

document.getElementById("viewerNext").addEventListener("click", () => {
    changePhoto(1);
});

document.getElementById("closeViewer").addEventListener("click", () => {
    photoViewer.classList.remove("active");
});

photoViewer.addEventListener("click", event => {
    if (event.target === photoViewer) {
        photoViewer.classList.remove("active");
    }
});

document.addEventListener("keydown", event => {
    if (!photoViewer.classList.contains("active")) return;

    if (event.key === "Escape") {
        photoViewer.classList.remove("active");
    }

    if (event.key === "ArrowRight") changePhoto(1);
    if (event.key === "ArrowLeft") changePhoto(-1);
});

const SUPABASE_URL = "https://biadagfpzeernbtfjufl.supabase.co";

const SUPABASE_KEY = "sb_publishable_53z7SZKnakm9o-tn0vU9Lg_k13sQL8W";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Supabase Connected!");
console.log("Supabase Connected!");

async function testSupabase() {
    const { data, error } = await supabaseClient
        .from("destinations")
        .select("*");

    if (error) {
        console.error("Supabase Error:", error.message);
        return;
    }

    console.log("Database Connected!");
    console.log(data);
}

testSupabase();