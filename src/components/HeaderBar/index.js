import { Components } from "tracker-capture-app-core";
import { useTranslation } from "react-i18next";
const { HeaderBar } = Components;

const HeaderBarContainer = () => {
  const { t } = useTranslation();
  return <HeaderBar title={t("CARPHA Mortality Surveillance Module")} />;
};

export default HeaderBarContainer;
