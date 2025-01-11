import { useState } from "react";
import { Editor } from "./components/Editor";

function App() {
  const [image, setImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900">
      {!image ? (
        <div className="flex h-full items-center justify-center">
          <label className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
            Choose Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      ) : (
        <Editor image={image} />
      )}
    </div>
  );
}

export default App;
