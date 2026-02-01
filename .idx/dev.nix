{ pkgs, ... }: {
  channel = "unstable";
  packages = [
    pkgs.nodejs_20 
    pkgs.typescript
    pkgs.docker-compose
  ];

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "start"]; 
          manager = "web";
          env = { PORT = "3000"; };
        };
      };
    };
    workspace = {
      onCreate = {
        npm-install = "npm install";
        default.openFiles = [ "README.md" ];
      };
      onStart = {
        build-server = "npm run build";
      };
    };
  };
}
