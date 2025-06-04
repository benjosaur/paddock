export const calculateTimeToDate = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);

  if (expiry < today) {
    const diff = today.getTime() - expiry.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    let result = "Expired ";
    if (years > 0) result += `${years}y `;
    if (months > 0) result += `${months}m `;
    if (remainingDays > 0 || (years === 0 && months === 0))
      result += `${remainingDays}d`;
    return result + " ago";
  }

  let years = expiry.getFullYear() - today.getFullYear();
  let months = expiry.getMonth() - today.getMonth();
  let days = expiry.getDate() - today.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(expiry.getFullYear(), expiry.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  let result = "";
  if (years > 0) result += `${years}y `;
  if (months > 0) result += `${months}m `;
  if (days > 0 || (years === 0 && months === 0)) result += `${days}d`;

  return result.trim();
};

export const calculateAgeBracket = (dob: string): string => {
  if (!dob) return "Unknown";

  const today = new Date();
  const birthDate = new Date(dob);

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  if (age < 0) return "Unknown";

  const bracket = Math.floor(age / 5) * 5;
  return `${bracket}-${bracket + 4}`;
};
