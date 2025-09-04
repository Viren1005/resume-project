import { useState } from "react";
import api from "../lib/api";

export default function Index() {
  const [data, setData] = useState<string>("");

  const handleCheck = async () => {
    try {
      const res = await api.get("/"); // 👈 test FastAPI root
      setData(res.data.message || JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
      setData("Error while fetching data");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Frontend Connected ✅</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        onClick={handleCheck}
      >
        Check Backend
      </button>
      <p className="mt-4">Response: {data}</p>
    </div>
  );
}
