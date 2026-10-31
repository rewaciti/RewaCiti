import { useRef } from "react";
import { newRequestKey } from "../lib/realEstateApi";

/**
 * One key per thing being sent. Pressing submit twice, or again after a
 * timeout, returns the first answer instead of making a second record.
 * A request that failed can be sent again with the same key.
 */
const useRequestKey = () => {
  const key = useRef(newRequestKey());
  return {
    current: () => key.current,
    /** Call once it has gone through, so the next one is new. */
    renew: () => {
      key.current = newRequestKey();
    },
  };
};

export default useRequestKey;
