export function featureEnabled(name: "CHESSOPS") {
  if (name === "CHESSOPS") return process.env.NEXT_PUBLIC_FEATURE_CHESSOPS === "1";
  return false;
}
