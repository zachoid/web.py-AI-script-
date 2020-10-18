import React, { Component, Fragment, useState } from "react";
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup";
import PageTitle from "../../../Layout/AppMain/PageTitle";
import { makeData } from "./utils";
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import Crypto from "crypto-js";
import { renderToStaticMarkup } from "react-dom/server";
import ReactTable from "react-table";
import CustomPaginator from "./PaginationComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Workbook from "react-excel-workbook";
import cx from "classnames";
import "./Style/Country.css";
import { Row, Col, Card, CardBody, Button, Modal } from "reactstrap";
import SweetAlert from "sweetalert-react";
import {
  faTrashAlt,
  faPencilAlt,
  faSave,
  faTimes,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import MyModel from "../../Actions/Model";
import { toast, Slide, Zoom, Flip, Bounce } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Alert from "../../Actions/Alert";
import filterFactory, { textFilter } from "react-bootstrap-table2-filter";
import SorryImg from "../../../../Assets/utils/images/download.png";
import ExportPDF from "./Controls/ExportPDF";

// SECTION ## GQL QUERIES ##
// NOTE GQL GET COUNTRY
const GETCOUNTRY = gql`
  query($limit: Int!, $Pageno: Int!) {
    getCountry(limit: $limit, Pageno: $Pageno) {
      countryid
      countrycode
      countryname
      rowindex
      isdefault
    }
  }
`;

// NOTE GQL UPDATE COUNTRY
const UPDATECOUNTRY = gql`
  query($countryid: Int!, $countrycode: String!, $countryname: String!) {
    updateCountry(
      countrycode: $countrycode
      countryname: $countryname
      countryid: $countryid
    ) {
      success
    }
  }
`;

// TODO GQL DELETE COUNTRY
const DELETE = gql`
  query($countryid: Int!) {
    deleteCountry(countryid: $countryid) {
      success
    }
  }
`;
console.log("UPDATE COUNTRY", UPDATECOUNTRY);
{
  // const dtCountry = [
  //   { countryName: "waste", sNo: "1", sortCode: "bells" },
  //   { countryName: "waste", sNo: "2", sortCode: "bells" },
  //   { countryName: "waste", sNo: "3", sortCode: "bells" },
  //   { countryName: "waste", sNo: "4", sortCode: "bells" },
  //   { countryName: "waste", sNo: "5", sortCode: "bells" },
  // ];
}
const Country = (props) => {
  // SECTION USEQURIES FOR GQL
  const { loading, error, data } = useQuery(GETCOUNTRY, {
    variables: { limit: -1, Pageno: 0 },
    onCompleted: (d) => setData(d.getCountry),
  });

  const [
    OnEdit,
    { called, loading: loadingU, data: dataU, error: errorU },
  ] = useLazyQuery(UPDATECOUNTRY, {
    onCompleted: (d) => console.log("Updated :)"),
  });

  const [
    OnDelete,
    { called: calledD, loading: loadingD, data: dataD, error: errorD },
  ] = useLazyQuery(DELETE, {
    onCompleted: (d) => console.log("Deleted :'("),
  });

  // SECTION States
  const { buttonLabel, className } = props;
  const [iseditable, setIseditable] = useState(false);
  const [goToPage, setGoToPage] = useState("1");
  const [CountryDT, setData] = useState(
    data === undefined ? [] : data.getCountry
  );
  const [model, setModel] = useState(false);
  const [modelDownload, setModelDownload] = useState(false);
  const [isdefault, setIsDefault] = useState(false);
  const [isAddToggled, setIsAddToggled] = useState(false);
  const [Editprops, setEditprops] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [type, setType] = useState("info");
  const getdata = CountryDT;

  // NOTE Columns and their values which is to be exported into excel
  const excelData = (
    <Workbook.Sheet data={CountryDT} name="Sheet A">
      <Workbook.Column label="Serial No." value="rowindex" />
      <Workbook.Column label="Short Code" value="countrycode" />
      <Workbook.Column label="countryName" value="countryname" />
    </Workbook.Sheet>
  );

  // NOTE This is for toggling DELETE RECORD Alert-Box AND DELETE BUTTON LOGIC AND TOGGLE BACK
  const toggleShow = (e, cellInfo) => {
    setShowAlert(!showAlert);
    console.log("aaya", cellInfo.original.countryid);
    // DELETE FUNCTION GQL
    function handleDeleteCountryDt() {
      OnDelete({
        variables: {
          countryid: cellInfo.original.countryid,
        },
      });
      const showToast = () =>
        toast["error"]("✔️ Record deleted successfully!", {
          position: toast.POSITION.BOTTOM_RIGHT,
          transition: Zoom,
        });
      showToast();
    }
    handleDeleteCountryDt();
  };

  // NOTE UPDATE BUTTON LOGIC AND TOGGLE BACK TO DEFAULT STATE
  const updateCountryDt = (e, cellInfo) => {
    console.log("aaya", cellInfo.original.countryid);
    const tempdata = [...CountryDT];
    tempdata[cellInfo.index].Editprops =
      tempdata[cellInfo.index].Editprops === undefined
        ? true
        : !tempdata[cellInfo.index].Editprops;
    tempdata[cellInfo.index].oldCode =
      tempdata[cellInfo.index].oldCode === undefined
        ? tempdata[cellInfo.index].sortCode
        : tempdata[cellInfo.index].oldCode;

    tempdata[cellInfo.index].OldName =
      tempdata[cellInfo.index].OldName === undefined
        ? tempdata[cellInfo.index].countryName
        : tempdata[cellInfo.index].OldName;

    function handleEditCountryDt() {
      OnEdit({
        variables: {
          countryid: cellInfo.original.countryid,
          countryname: cellInfo.original.countryname,
          countrycode: cellInfo.original.countrycode,
        },
      });
      const showToast = () =>
        toast["success"]("✔️ Record updated successfully!", {
          position: toast.POSITION.BOTTOM_RIGHT,
          transition: Flip,
        });
      showToast();
    }
    handleEditCountryDt();

    setData(tempdata);
  };

  // NOTE ON CLICK OF EDIT THIS WILL TOGGLE THAT TO SAVE BUTTON
  const toggleEdit = (e, cellInfo) => {
    console.log("aaya", cellInfo.original.countryid);
    const tempdata = [...CountryDT];
    tempdata[cellInfo.index].Editprops =
      tempdata[cellInfo.index].Editprops === undefined
        ? true
        : !tempdata[cellInfo.index].Editprops;
    tempdata[cellInfo.index].oldCode =
      tempdata[cellInfo.index].oldCode === undefined
        ? tempdata[cellInfo.index].sortCode
        : tempdata[cellInfo.index].oldCode;

    tempdata[cellInfo.index].OldName =
      tempdata[cellInfo.index].OldName === undefined
        ? tempdata[cellInfo.index].countryName
        : tempdata[cellInfo.index].OldName;
    setData(tempdata);
  };

  const cancelToggleEdit = (e, cellInfo) => {
    const tempdata = [...CountryDT];
    tempdata[cellInfo.index].Editprops =
      tempdata[cellInfo.index].Editprops === undefined
        ? true
        : !tempdata[cellInfo.index].Editprops;
    tempdata[cellInfo.index].sortCode = tempdata[cellInfo.index].oldCode;
    tempdata[cellInfo.index].countryName = tempdata[cellInfo.index].OldName;
    setData(tempdata);
    // console.log("aaya", tempdata);
  };

  const resetForm = (e, cellInfo) => {
    const resetData = [...CountryDT];
    resetData[cellInfo.index].sortCode = resetData[cellInfo.index].oldCode;
    resetData[cellInfo.index].countryName = resetData[cellInfo.index].OldName;
    setData(resetData);
    // console.log("aaya", tempdata);
  };

  // NOTE Model: This is for toggling Pop-up
  const toggle = () => {
    setModel(!model);
  };

  // NOTE Model: toggle download pop-up
  const toggleDownload = () => {
    setModelDownload(!modelDownload);
  };

  // NOTE Action: Edit and Delete btn
  const actionButton = (cellInfo) => {
    // console.log("cellInfo", cellInfo);
    return (
      <div className="widget-content-right widget-content-actions d-flex align-items-center justify-content-center">
        <Button
          className={cx("border-0 btn-transition", {
            "d-none":
              cellInfo.original.Editprops === undefined
                ? false
                : cellInfo.original.Editprops,
          })}
          outline
          color="success"
          //onClick={toggle}
          onClick={(e) => toggleEdit(e, cellInfo)}
        >
          <FontAwesomeIcon icon={faPencilAlt} />
        </Button>
        <Button
          className={cx("border-0 btn-transition", {
            "d-none": !cellInfo.original.Editprops,
          })}
          outline
          color="success"
          //onClick={toggle}
          onClick={(e) => updateCountryDt(e, cellInfo)}
        >
          <FontAwesomeIcon icon={faSave} />
        </Button>

        <Button
          className="border-0 btn-transition"
          outline
          color="danger"
          onClick={(e) => toggleShow(e, cellInfo)}
        >
          <FontAwesomeIcon icon={faTrashAlt} />
        </Button>

        <Button
          className={cx("border-0 btn-transition", {
            "d-none": !cellInfo.original.Editprops,
          })}
          outline
          color="grey"
          onClick={(e) => resetForm(e, cellInfo)}
        >
          <FontAwesomeIcon icon={faUndo} />
        </Button>

        <Button
          className={cx("border-0 btn-transition", {
            "d-none": !cellInfo.original.Editprops,
          })}
          outline
          color="danger"
          onClick={(e) => cancelToggleEdit(e, cellInfo)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </div>
    );
  };

  const handleIsDefault = () => {
    setIsDefault(!isdefault);
  };

  // NOTE Action: Default btn
  const actionButtonIsDefault = (cellInfo) => {
    return (
      <div className="d-block w-100 text-center">
        <Button
          className="btn-icon btn-icon-only btn btn-link"
          onClick={handleIsDefault}
          color="link"
        >
          {isdefault ? (
            <i className="fa fa-toggle-on" style={{ fontSize: "1.5em" }} />
          ) : (
            <i className="fa fa-toggle-off" style={{ fontSize: "1.5em" }} />
          )}
        </Button>
        {/* <FormGroup>
          <Container>
            <Label check style={{ marginLeft: ".8em" }}>
              <Input type="checkbox" />
            </Label>
          </Container>
        </FormGroup> */}
      </div>
    );
  };

  // Note
  const renderEditable = (cellInfo) => {
    if (!CountryDT[cellInfo.index].Editprops) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html:
              CountryDT[cellInfo.index][cellInfo.column.id] === undefined
                ? ""
                : CountryDT[cellInfo.index][cellInfo.column.id],
          }}
        />
      );
    } else {
      return (
        <div
          style={{ backgroundColor: "#fafafa" }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const tempdata = [...CountryDT];
            tempdata[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
            setData(tempdata);
          }}
          dangerouslySetInnerHTML={{
            __html:
              CountryDT[cellInfo.index][cellInfo.column.id] === undefined
                ? ""
                : CountryDT[cellInfo.index][cellInfo.column.id],
          }}
        />
      );
    }
  };

  const defaultSorted = [
    {
      dataField: "name",
      order: "desc",
    },
  ];
  // console.log("hello array", getdata);
  return (
    <Fragment>
      {/* NOTE Header: Contain page title, Download/Add btn and info */}
      <PageTitle
        heading="Country"
        // subheading="Basic example of a React table with sort, search and filter functionality."
        icon="pe-7s-global icon-gradient bg-mixed-hopes"
        excelData={excelData}
        CountryDT={CountryDT}
      />

      <CSSTransitionGroup
        component="div"
        transitionName="TabsAnimation"
        transitionAppear={true}
        transitionAppearTimeout={0}
        transitionEnter={false}
        transitionLeave={false}
      >
        <Row>
          <Col md="12">
            <Card className="main-card mb-3">
              <CardBody>
                <ReactTable
                  PaginationComponent={CustomPaginator}
                  data={CountryDT}
                  columns={[
                    {
                      Header: "Serial No.",
                      columns: [
                        {
                          Header: "",
                          accessor: "rowindex",
                        },
                      ],
                    },
                    {
                      Header: "Country Details",
                      columns: [
                        {
                          Header: "Short Code",
                          accessor: "countrycode",
                          Cell: renderEditable,
                          filterable: true,
                        },
                        {
                          Header: "Country Name",
                          accessor: "countryname",
                          Cell: renderEditable,
                          filterable: true,
                        },
                      ],
                    },
                    {
                      Header: "Status",
                      columns: [
                        {
                          Header: "Is Default",
                          accessor: isdefault,
                          Cell: actionButtonIsDefault,
                        },
                      ],
                    },
                    {
                      Header: "Action",
                      columns: [
                        {
                          Cell: actionButton,
                          getProps: (Column) => {
                            return {
                              style: {
                                display: "flex",
                                justifyContent: "space-around",
                              },
                            };
                          },
                        },
                      ],
                    },
                  ]}
                  defaultPageSize={10}
                  className="-striped -highlight"
                />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </CSSTransitionGroup>
      {/* NOTE  calling Model component*/}
      <div>
        <span className="d-inline-block mb-2 mr-2">
          <Modal
            isOpen={model}
            toggle={toggle}
            className={className}
            contentClassName="custom-modal-style"
          >
            <MyModel Editprops={Editprops} mytoggle={() => toggle()} />
          </Modal>
        </span>
      </div>
      {/* NOTE  calling Alert component*/}
      <div>
        <Col md="3">
          <Card className="mb-3 text-center">
            {/* <CardBody> */}
            {/* <SweetAlert
                show={showAlert}
                title="Demo Complex"
                type="success"
                text="SweetAlert in React"
                showCancelButton
                onConfirm={() => setShowAlert(!showAlert)}
                onCancel={() => setShowAlert(!showAlert)}
                onEscapeKey={() => setShowAlert(!showAlert)}
                onOutsideClick={() => setShowAlert(!showAlert)}
              /> */}
            <SweetAlert
              title="Are you sure?"
              confirmButtonColor="#dc3545"
              confirmButtonStyle="danger"
              show={showAlert}
              text="Do you really want to delete these records? This process cannot be undone."
              type="error"
              // html
              // text={renderToStaticMarkup(
              //   <div>
              //     <div>
              //       <p>
              //         Do you really want to delete these records? This process
              //         cannot be undone.
              //       </p>
              //     </div>

              //     <div
              //       style={{
              //         marginTop: "1em",
              //         display: "flex",
              //         justifyContent: "center",
              //       }}
              //     >
              //       <Button style={{ marginRight: "1em" }}>Cancel</Button>
              //       <Button
              //         className="bg-danger"
              //         style={{ marginLeft: "1em" }}
              //         onClick={() => console.log("roger its working")}
              //       >
              //         Confirm
              //       </Button>
              //     </div>
              //   </div>
              // )}
              confirmButtonText="Confirm"
              onConfirm={toggleShow}
              showCancelButton
              onCancel={() => setShowAlert(!showAlert)}
            />
            {/* </CardBody> */}
          </Card>
        </Col>
      </div>
    </Fragment>
  );
};

export default Country;
