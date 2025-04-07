import moment from "moment";
/* REDUX */
import {connect} from "react-redux";
/*       */
import {Button, Col, Row, Select, message, Modal} from "antd";
import {CaretRightOutlined, FileExcelOutlined} from "@ant-design/icons";
import "./index.css";
import {useState, useEffect} from "react";
import {writeFile} from "../../utils/excel.utility";
import {Hooks} from "tracker-capture-app-core";
import Content from "./Content";
import XLSX from "xlsx";
import {useTranslation} from "react-i18next";

const {useApi} = Hooks;

const {Option} = Select;
const OPTIONS = [];
for (let i = moment().year(); i >= 1970; i--) {
    OPTIONS.push(<Option key={i}>{i}</Option>);
}

const countryCodes = require("../../asset/metadata/iso3_code.json");

const Export = ({route, orgUnits}) => {
    const {t} = useTranslation();
    const {dataApi} = useApi();
    const getData = async (year) =>
        dataApi.pull(
            `/api/sqlViews/XpI2kVApPIH/data?paging=false&var=year:${year}`
        );
    const [periodType, setPeriodType] = useState("Yearly");
    const [selectedPeriods, selectPeriod] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [data, setData] = useState(null);
    const [isEnableExport, setIsEnableExport] = useState(false);
    const [countryCode, setCountryCode] = useState(null);
    const [countryCodeModal, setCountryCodeModal] = useState(false);

    useEffect(() => {
        (async () => {
            const countryCodeFromDataStore = await dataApi.pull("/api/dataStore/WHO_ICD11_COD/countryCode");
            if (countryCodeFromDataStore) {
                const cc = orgUnits.find(({level}) => level === 2) ? orgUnits.find(({level}) => level === 2).code : undefined;
                const isValid = cc && countryCodes.find(({code}) => code === cc);
                if (isValid) {
                    setCountryCode(isValid);
                    await dataApi.push("/api/dataStore/WHO_ICD11_COD/countryCode", isValid);
                } else {
                    setCountryCodeModal(true);
                }
            } else {
                setCountryCodeModal(true);
                setCountryCode(countryCodeFromDataStore);
            }
        })();
    }, []);

    // Function to open the modal for selecting another country
    const openCountryCodeModal = () => {
        setCountryCodeModal(true);
    };

    return (
        <div className="export-wrapper">
            <div className="export-container">
                <Row style={{width: "100%", padding: 9}} gutter={5}>
                    <Col>
                        {/* <Select
              style={{ width: 200 }}
              value={periodType}
              placeholder="Select period type"
              onChange={setPeriodType}
            >
              {OPTIONS.map((option) => (
                <Option value={option.value}>{option.label}</Option>
              ))}
            </Select> */}
                        <Select
                            mode="multiple"
                            allowClear
                            style={{width: "500px"}}
                            placeholder={t("pleaseSelectYear")}
                            onChange={(value) => {
                                selectPeriod(value);
                            }}
                        >
                            {OPTIONS}
                        </Select>
                    </Col>
                    <Col>
                        <Button
                            loading={isRunning}
                            disabled={!selectedPeriods || isRunning}
                            onClick={async () => {
                                setIsRunning(true);
                                setData(null);
                                const data = {};
                                let error = false;
                                for (let i = 0; i < selectedPeriods.length; i++) {
                                    const year = selectedPeriods[i];
                                    data[year] = await getData(year);
                                    if (data[year].status && data[year].status === "ERROR") {
                                        error = true;
                                    }
                                }
                                if (error) {
                                    message.error("ERROR!!! Please run analytics before using ANACoD")
                                } else {
                                    setData(data);
                                    setIsEnableExport(true);
                                }
                                setIsRunning(false);
                            }}
                            type="primary"
                            icon={<CaretRightOutlined/>}
                        >
                            {t("run")}
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            disabled={!isEnableExport}
                            icon={<FileExcelOutlined/>}
                            onClick={() => {
                                var wb = XLSX.utils.book_new();
                                Object.entries(data)
                                    .sort(([a], [b]) => b - a)
                                    .map(
                                        ([
                                             year,
                                             {
                                                 listGrid: {rows, headers},
                                             },
                                         ]) => {
                                            const heads = headers.map(({name}) => name);
                                            const ws = XLSX.utils.json_to_sheet(
                                                rows.map((row) =>
                                                    row.reduce((result, cell, index) => {
                                                        result[heads[index]] = index === 0 ? countryCode.country : index === 1 ? countryCode.code : cell;
                                                        return result;
                                                    }, {})
                                                ),
                                                {
                                                    header: heads,
                                                }
                                            );
                                            return XLSX.utils.book_append_sheet(wb, ws, year);
                                        }
                                    );
                                writeFile(wb, "ANACOD.csv");
                            }}
                        >
                            {t("anacodExportExcel")}
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            onClick={openCountryCodeModal}
                        >
                            Select Another Country
                        </Button>
                    </Col>
                </Row>
                {countryCode && <Content loading={isRunning} loaded={!!data} data={data} countryCode={countryCode}/>}
                <Modal
                    title="Select the country code"
                    visible={countryCodeModal}
                    okText={"Select"}
                    onOk={() => {
                        dataApi.push("/api/dataStore/WHO_ICD11_COD/countryCode", countryCode);
                        setCountryCodeModal(false);
                    }}
                    onCancel={() => {
                        setCountryCodeModal(false);
                        window.location.reload();
                    }}
                    okButtonProps={{
                        disabled: countryCode === null
                    }}
                    cancelButtonProps={{
                        disabled: true
                    }}
                >
                    <p>Can't find the country code from the root orgUnit or the code is invalid.</p>
                    <p>Please select the country code from the list here. This selection will be stored for next times,
                        and this popup won't show again.</p>
                    <div>
                        <Select
                            showSearch
                            style={{
                                width: "100%",
                            }}
                            placeholder="Select a country code"
                            options={countryCodes.map(countryCode => ({
                                value: countryCode.code,
                                label: `${countryCode.code} | ${countryCode.country}`
                            }))}
                            onChange={(value) => {
                                setCountryCode(countryCodes.find(({code}) => code === value));
                            }}
                            optionFilterProp="label"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </div>
                </Modal>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => {
    return {
        route: state.route,
        orgUnits: state.metadata.orgUnits
    };
};

export default connect(mapStateToProps)(Export);
