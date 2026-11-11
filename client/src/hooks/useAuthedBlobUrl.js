import { useEffect, useState } from "react";
import axios from "axios";

export default function useAuthedBlobUrl(path, enabled = true, fallbackError = "Unable to load this file.") {
  const [file, setFile] = useState({ url: "", type: "", loading: false, error: "" });

  useEffect(() => {
    if (!path || !enabled) {
      setFile({ url: "", type: "", loading: false, error: "" });
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = "";
    setFile({ url: "", type: "", loading: true, error: "" });
    axios.get(path, { responseType: "blob", signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(data);
        setFile({ url: objectUrl, type: data.type || "", loading: false, error: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setFile({
          url: "",
          type: "",
          loading: false,
          error: error.response?.data?.error || fallbackError
        });
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, enabled, fallbackError]);

  return file;
}
