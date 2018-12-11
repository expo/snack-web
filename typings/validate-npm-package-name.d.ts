declare module 'validate-npm-package-name' {
  type ValidationResult = {
    validForOldPackages: boolean;
    validForNewPackages: boolean;
  };

  export default function(name: string | null): ValidationResult;
}
