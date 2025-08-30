import { zxcvbn, type ZxcvbnResult } from "@zxcvbn-ts/core";
import { useMemo, useState } from "react";

export const usePasswordStrength = () => {
  const [passwordStrength, setPasswordStrength] = useState<ZxcvbnResult | null>(
    null
  );

  const setPassword = (password: string) => {
    if (password.length > 0) {
      const result = zxcvbn(password);
      setPasswordStrength(result);
    } else {
      setPasswordStrength(null);
    }
  };

  const text = useMemo(() => {
    if (!passwordStrength) return "";
    return getPasswordStrengthText(passwordStrength.score);
  }, [passwordStrength]);

  const textColor = useMemo(() => {
    if (!passwordStrength) return "";
    return getPasswordStrengthTextColor(passwordStrength?.score);
  }, [passwordStrength]);

  const backgroundColor = useMemo(() => {
    if (!passwordStrength) return "";
    return getPasswordStrengthBgColor(passwordStrength?.score);
  }, [passwordStrength]);

  const percentage = useMemo(() => {
    if (!passwordStrength) return 0;
    return (passwordStrength.score + 1) * 20;
  }, [passwordStrength]);

  return {
    shouldShow: !!passwordStrength,
    setPassword,
    text,
    textColor,
    backgroundColor,
    percentage,
  };
};

function getPasswordStrengthText(score: number) {
  switch (score) {
    case 0:
      return "Very weak";
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
}

function getPasswordStrengthTextColor(score: number) {
  switch (score) {
    case 0:
    case 1:
      return "text-red-400";
    case 2:
      return "text-orange-400";
    case 3:
      return "text-yellow-400";
    case 4:
      return "text-green-400";
    default:
      return "text-slate-400";
  }
}

function getPasswordStrengthBgColor(score: number) {
  switch (score) {
    case 0:
    case 1:
      return "bg-red-400";
    case 2:
      return "bg-orange-400";
    case 3:
      return "bg-yellow-400";
    case 4:
      return "bg-green-400";
    default:
      return "bg-slate-400";
  }
}

export default usePasswordStrength;
