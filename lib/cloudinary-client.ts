export async function uploadToCloudinary(file: File, folder: string) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "tanxmis");

  formData.append("folder", `tanx-mis/${folder}`);

  // ✅ Important
  formData.append("resource_type", "auto");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dqfjggcju/auto/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    const error = await res.json();

    console.error("Cloudinary Error:", error);

    throw new Error(error?.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}
