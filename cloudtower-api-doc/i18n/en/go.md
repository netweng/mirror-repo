import '../../swagger/utils/autoScroll';

# CloudTower Go SDK

The CloudTower SDK in the Golang environment is applicable to golang 1.16 or above. 

- [Source COde](https://github.com/smartxworks/cloudtower-go-sdk)
- [Download Links](https://github.com/smartxworks/cloudtower-go-sdk/releases)

## Installation 

```shell
go get github.com/smartxworks/cloudtower-go-sdk
```

## Use 

> The sample uses two tool libraries: [pointy](https://github.com/openlyinc/pointy) and [go-funk](https://github.com/thoas/go-funk). `Pointy` is used to quickly create a pointer of a primitive type, and `go-funk` provides some tool methods, such as Map, Filter, and Reduce.


### Create Instance 

#### Create `ApiClient` Instance 

```go
import (
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	httptransport "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
)
transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
client := apiclient.New(transport, strfmt.Default)
```

### Send Request

#### Import Corresponding `client` Package

> Import or create the `client` package corresponding to a specific operation.

```go
import (
  	vm "github.com/smartxworks/cloudtower-go-sdk/client/vm"
)
```

#### Verify Authentication

```go
import (
  User "github.com/smartxworks/cloudtower-go-sdk/client/user"
)
loginParams := User.NewLoginParams()
loginParams.RequestBody = &models.LoginInput{
	Username: pointy.String("username"),
	Password: pointy.String("password"),
	Source:   models.NewUserSource(models.UserSourceLOCAL),
}
logRes, err := client.User.Login(loginParams)
if err != nil {
	return err
}
transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", *logRes.Payload.Data.Token)
```

#### Obtain Resources

```go
getVmParams := vm.NewGetVmsParams();
getVmParams.RequestBody = &models.GetVmsRequestBody{
	Where: &models.VMWhereInput{
		ID: pointy.String("vm_id"),
	},
}
vmsRes, err := client.VM.GetVms(getVmParams)
if err != nil {
	return err
}
vms := vmsRes.Payload
```

#### Update Resources

> Updating resources will have the asynchronous task. Resources will be updated when the asynchronous task is done.

```go
target_vm := vmsRes.Payload[0]
vmStartParams := vm.NewStartVMParams()
vmStartParams.RequestBody = &models.VMStartParams{
	Where: &models.VMWhereInput{
		ID: target_vm.ID,
	},
}
startRes, err := client.VM.StartVM(vmStartParams)
if err != nil {
	return err
}
```

> You can use the provided tool `WaitTask` to synchronously wait for the asynchronous task to end. If the task fails or times out, an error will be returned. The polling interval is 5 seconds, and the timeout period is 300 seconds.
>
> - Tool Parameter Description
>
> | Parameter | Type                | Must Have | Description            |
> | ------ | ------------------- | -------- | ------------------------ |
> | client | \*client.Cloudtower | Yes       | Check the `client` instance.|
> | id     | string              | Yes      | The ID of the task you want to check.|

```go
task := *startRes.Payload[0].TaskID
err = utils.WaitTask(client, task)
if err != nil {
	return err
}
```

> In the case of multiple tasks, multiple task ids can be accepted via `WaitTasks`. The rest is the same as `WaitTask`.
>
> - Tool Parameter Description
>
> | Parameter | Type               | Must Have | Description                     |
> | ------ | ------------------- | -------- | ------------------------ |
> | client | \*client.Cloudtower | Yes      | Check the `client` instance. |
> | ids    | []string            | Yes       | The ID list of the task you want to check. |

```go
tasks := funk.Map(startRes.Payload, func(tvm *models.WithTaskVM) string {
	return *tvm.TaskID
}).([]string)
err = utils.WaitTasks(client, tasks)
if err != nil {
	return err
}
```

#### Others

##### Set Language of Returned Information

> You can set the `ContentLanguage` item in the request params to set the language of the return value. The optional value is `["en-US", "zh-CN"]`, and the default value is `en-US`. Languages not in the range of optional values will return an HTTP 400 error.

```go
getTaskDefaultParams := task.NewGetTasksParams()
getTaskDefaultParams.RequestBody = &models.GetTasksRequestBody{
	First: pointy.Int32(10),
}
taskDefaultRes, err := client.Task.GetTasks(getTaskDefaultParams)

getTaskZhParams := task.NewGetTasksParams()
getTaskZhParams.RequestBody = &models.GetTasksRequestBody{
	First: pointy.Int32(10),
}
getTaskZhParams.ContentLanguage = pointy.String("zh-CN")
taskZhRes, err := client.Task.GetTasks(getTaskZhParams)
```

## Operation Examples

### Obtain Virtual Machine

#### Obtain All Virtual Machines

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"

	httptransport "github.com/go-openapi/runtime/client"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	vms, err := getAllVms(client)
	if err != nil {
		panic(err.Error())
	}
  // handle queried vms
}

func getAllVms(
	client *apiclient.Cloudtower) ([]*models.VM, error) {
	getAllVmsParams := vm.NewGetVmsParams()
	getAllVmsParams.RequestBody = &models.GetVmsRequestBody{}
	vmsRes, err := client.VM.GetVms(getAllVmsParams)
	if err != nil {
		return nil, err
	}
	return vmsRes.Payload, nil
}
```

#### Obtain Virtual Machines via Pagination 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	vms, err := getVmsWithPagination(client,50,100)
	if err != nil {
		panic(err.Error())
	}
  // handle queried vms
}

func getVmsWithPagination(
	client *apiclient.Cloudtower,
  from int32,
  to int32) ([]*models.VM, error) {
	getVmsWithPaginationParams := vm.NewGetVmsParams()
	getVmsWithPaginationParams.RequestBody = &models.GetVmsRequestBody{
		First: pointy.Int32(from+1),
		Skip:  pointy.Int32(to-from),
	}
	vmsRes, err := client.VM.GetVms(getVmsWithPaginationParams)
	if err != nil {
		return nil, err
	}
	return vmsRes.Payload, nil
}
```

#### Obtain All Running Virtual Machines

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	vms, err := getAllRunningVms(client)
	if err != nil {
		panic(err.Error())
	}
  // handle queried vms
}

func getAllRunningVms(
	client *apiclient.Cloudtower) ([]*models.VM, error) {
	getAllRunningVmsParams := vm.NewGetVmsParams()
	getAllRunningVmsParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			Status: models.VMStatusRUNNING.Pointer(),
		},
	}
	vmsRes, err := client.VM.GetVms(getAllRunningVmsParams)
	if err != nil {
		return nil, err
	}
	return vmsRes.Payload, nil
}
```

#### Obtain Virtual Machine with A Specific String in Its Name or Description

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	vms, err := getVmsMatchStr(client, "matchStr")
	if err != nil {
		panic(err.Error())
	}
  // handle queried vms
}

func getVmsMatchStr(
	client *apiclient.Cloudtower,
	match string) ([]*models.VM, error) {
	getAllVmNameMatchStrParams := vm.NewGetVmsParams()
	getAllVmNameMatchStrParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			NameContains: pointy.String(match),
		},
	}
	vmsRes, err := client.VM.GetVms(getAllVmNameMatchStrParams)
	if err != nil {
		return nil, err
	}
	return vmsRes.Payload, nil
}
```

#### Get All Virtual Machines with vCPU Greater Than N

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	vms, err := getVmshasNMoreCpuCore(client, 4)
	if err != nil {
		panic(err.Error())
	}
  // handle queried vms
}

func getVmshasNMoreCpuCore(
	client *apiclient.Cloudtower,
	n int32) ([]*models.VM, error) {
	getAllVmCoreGtNParams := vm.NewGetVmsParams()
	getAllVmCoreGtNParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			VcpuGt: pointy.Int32(n),
		},
	}
	vmsRes, err := client.VM.GetVms(getAllVmCoreGtNParams)
	if err != nil {
		return nil, err
	}
	return vmsRes.Payload, nil
}
```

### Create Virtual Machine from Template 

#### Specify ID Only 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createdVm, err := createVmFromTemplate(client, "templateId", "clusterId", "vm_name")
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVmFromTemplate(
	client *apiclient.Cloudtower,
	templateId string,
	clusterId string,
	name string) (*models.VM, error) {
	createVmFromTemplateParams := vm.NewCreateVMFromTemplateParams()
	createVmFromTemplateParams.RequestBody = []*models.VMCreateVMFromTemplateParams{
		{
			TemplateID: pointy.String(templateId),
			ClusterID:  pointy.String(clusterId),
			Name:       pointy.String(name),
			IsFullCopy: pointy.Bool(false),
		},
	}
	createRes, err := client.VM.CreateVMFromTemplate(createVmFromTemplateParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Configure NIC Parameters If Needed

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createVmFromTemplateParams := vm.NewCreateVMFromTemplateParams()
	createVmFromTemplateParams.RequestBody = []*models.VMCreateVMFromTemplateParams{
		{
			TemplateID: pointy.String("templateId"),
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("vm_name"),
			VMNics: []*models.VMNicParams{
				{
					ConnectVlanID: pointy.String("vlanId2"),
					Enabled:       pointy.Bool(true),
					Model:         models.VMNicModelVIRTIO.Pointer(),
				},
			},
			IsFullCopy: pointy.Bool(false),
		},
	}
	createdVm, err := createVmFromTemplate(client, createVmFromTemplateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVmFromTemplate(
	client *apiclient.Cloudtower,
	createVmFromTemplateParams *vm.CreateVMFromTemplateParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVMFromTemplate(createVmFromTemplateParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

### Create Blank Virtual Machine

#### Create Virtual Machine without Complex Configurations

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createParams := vm.NewCreateVMParams()
	createParams.RequestBody = []*models.VMCreationParams{
		{
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("test_vm_name"),
			Ha:         pointy.Bool(true),
			CPUCores:   pointy.Int32(4),
			CPUSockets: pointy.Int32(2),
			Memory:     pointy.Float64(8 * 1024 * 1024 * 1024),
			Vcpu:       pointy.Int32(4 * 2),
			Status:     models.VMStatusSTOPPED.Pointer(),
			Firmware:   models.VMFirmwareBIOS.Pointer(),
			VMNics: []*models.VMNicParams{
				{ConnectVlanID: pointy.String("vlanId1")},
			},
			VMDisks: &models.VMDiskParams{
				MountCdRoms: []*models.VMCdRomParams{
					{
						Boot:  pointy.Int32(0),
						Index: pointy.Int32(0),
					},
				},
			},
		},
	}
	createdVm, err := createVm(client, createParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVm(
	client *apiclient.Cloudtower,
	createParams *vm.CreateVMParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVM(createParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}

```

#### Configure Virtual Disk When Creating Virtual Machine

##### Load ISO on CD-ROM

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createParams := vm.NewCreateVMParams()
	createParams.RequestBody = []*models.VMCreationParams{
		{
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("test_vm_name"),
			Ha:         pointy.Bool(true),
			CPUCores:   pointy.Int32(4),
			CPUSockets: pointy.Int32(2),
			Memory:     pointy.Float64(8 * 1024 * 1024 * 1024),
			Vcpu:       pointy.Int32(4 * 2),
			Status:     models.VMStatusSTOPPED.Pointer(),
			Firmware:   models.VMFirmwareBIOS.Pointer(),
			VMNics: []*models.VMNicParams{
				{ConnectVlanID: pointy.String("vlanId1")},
			},
			VMDisks: &models.VMDiskParams{
				MountCdRoms: []*models.VMCdRomParams{
					{
						Index:      pointy.Int32(0),
						Boot:       pointy.Int32(0),
						ElfImageID: pointy.String("elfImageId"),
					},
				},
			},
		},
	}
	createdVm, err := createVm(client, createParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVm(
	client *apiclient.Cloudtower,
	createParams *vm.CreateVMParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVM(createParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Mount Existing Virtual Volume as Virtual Disk

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createParams := vm.NewCreateVMParams()
	createParams.RequestBody = []*models.VMCreationParams{
		{
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("test_vm_name"),
			Ha:         pointy.Bool(true),
			CPUCores:   pointy.Int32(4),
			CPUSockets: pointy.Int32(2),
			Memory:     pointy.Float64(8 * 1024 * 1024 * 1024),
			Vcpu:       pointy.Int32(4 * 2),
			Status:     models.VMStatusSTOPPED.Pointer(),
			Firmware:   models.VMFirmwareBIOS.Pointer(),
			VMNics: []*models.VMNicParams{
				{ConnectVlanID: pointy.String("vlanId1")},
			},
			VMDisks: &models.VMDiskParams{
				MountDisks: []*models.MountDisksParams{
					{
						Boot:       pointy.Int32(0),
						Bus:        models.BusVIRTIO.Pointer(),
						VMVolumeID: pointy.String("vmVolumeId1"),
						Index:      pointy.Int32(0),
					},
				},
			},
		},
	}
	createdVm, err := createVm(client, createParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVm(
	client *apiclient.Cloudtower,
	createParams *vm.CreateVMParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVM(createParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Mount Newly Added Virtual Disk

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createParams := vm.NewCreateVMParams()
	createParams.RequestBody = []*models.VMCreationParams{
		{
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("test_vm_name"),
			Ha:         pointy.Bool(true),
			CPUCores:   pointy.Int32(4),
			CPUSockets: pointy.Int32(2),
			Memory:     pointy.Float64(8 * 1024 * 1024 * 1024),
			Vcpu:       pointy.Int32(4 * 2),
			Status:     models.VMStatusSTOPPED.Pointer(),
			Firmware:   models.VMFirmwareBIOS.Pointer(),
			VMNics: []*models.VMNicParams{
				{ConnectVlanID: pointy.String("vlanId1")},
			},
			VMDisks: &models.VMDiskParams{
				MountNewCreateDisks: []*models.MountNewCreateDisksParams{
					{
						Boot: pointy.Int32(0),
						Bus:  models.BusVIRTIO.Pointer(),
						VMVolume: &models.MountNewCreateDisksParamsVMVolume{
							Size:             pointy.Float64(10 * 1024 * 1024 * 1024),
							ElfStoragePolicy: models.VMVolumeElfStoragePolicyTypeREPLICA2THINPROVISION.Pointer(),
							Name:             pointy.String("new_vm_disk_name"),
						},
					},
				},
			},
		},
	}
	createdVm, err := createVm(client, createParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVm(
	client *apiclient.Cloudtower,
	createParams *vm.CreateVMParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVM(createParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Configure Virtual NIC When Creating Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	createParams := vm.NewCreateVMParams()
	createParams.RequestBody = []*models.VMCreationParams{
		{
			ClusterID:  pointy.String("clusterId"),
			Name:       pointy.String("test_vm_name"),
			Ha:         pointy.Bool(true),
			CPUCores:   pointy.Int32(4),
			CPUSockets: pointy.Int32(2),
			Memory:     pointy.Float64(8 * 1024 * 1024 * 1024),
			Vcpu:       pointy.Int32(4 * 2),
			Status:     models.VMStatusSTOPPED.Pointer(),
			Firmware:   models.VMFirmwareBIOS.Pointer(),
			VMNics: []*models.VMNicParams{
				{
					ConnectVlanID: pointy.String("vlanId1"),
					Mirror:        pointy.Bool(true),
					Enabled:       pointy.Bool(false),
					Model:         models.VMNicModelE1000.Pointer(),
				},
			},
			VMDisks: &models.VMDiskParams{
				MountCdRoms: []*models.VMCdRomParams{
					{
						Boot:  pointy.Int32(0),
						Index: pointy.Int32(0),
					},
				},
			},
		},
	}
	createdVm, err := createVm(client, createParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func createVm(
	client *apiclient.Cloudtower,
	createParams *vm.CreateVMParams) (*models.VM, error) {

	createRes, err := client.VM.CreateVM(createParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

### Edit Virtual Machine

#### Edit Basic Information 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewUpdateVMParams()
	updateParams.RequestBody = &models.VMUpdateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMUpdateParamsData{
			Name:        pointy.String("updated_name"),
			Description: pointy.String("updated description"),
			Ha:          pointy.Bool(true),
			CPUCores:    pointy.Int32(2),
			CPUSockets:  pointy.Int32(8),
			Vcpu:        pointy.Int32(2 * 8),
			Memory:      pointy.Float64(16 * 1024 * 1024 * 1024),
		},
	}
	updatedVm, err := updateVm(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func updateVm(
	client *apiclient.Cloudtower,
	updateParams *vm.UpdateVMParams) (*models.VM, error) {
	updateRes, err := client.VM.UpdateVM(updateParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Edit CD-ROM

##### Add CD-ROM

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	addCdRomParams := vm.NewAddVMCdRomParams()
	addCdRomParams.RequestBody = &models.VMAddCdRomParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMAddCdRomParamsData{
			VMCdRoms: []*models.VMCdRomParams{
				{
					Index:      pointy.Int32(0),
					ElfImageID: pointy.String("elfImageId"),
					Boot:       pointy.Int32(0),
				},
			},
		},
	}
	updatedVm, err := addVmCdRom(client, addCdRomParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func addVmCdRom(
	client *apiclient.Cloudtower,
	addCdRomParams *vm.AddVMCdRomParams) (*models.VM, error) {
	updateRes, err := client.VM.AddVMCdRom(addCdRomParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Delete CD-ROM

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewRemoveVMCdRomParams()
	updateParams.RequestBody = &models.VMRemoveCdRomParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMRemoveCdRomParamsData{
			CdRomIds: []string{"cdRomId1", "cdRomId2"},
		},
	}
	updatedVm, err := removeVmCdRom(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func removeVmCdRom(
	client *apiclient.Cloudtower,
	removeCdRomParams *vm.RemoveVMCdRomParams) (*models.VM, error) {
	updateRes, err := client.VM.RemoveVMCdRom(removeCdRomParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Virtual Volume Operations

##### Add New Virtual Volume

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewAddVMDiskParams()
	updateParams.RequestBody = &models.VMAddDiskParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMAddDiskParamsData{
			VMDisks: &models.VMAddDiskParamsDataVMDisks{
				MountNewCreateDisks: []*models.MountNewCreateDisksParams{
					{
						VMVolume: &models.MountNewCreateDisksParamsVMVolume{
							ElfStoragePolicy: models.VMVolumeElfStoragePolicyTypeREPLICA2THINPROVISION.Pointer(),
							Size:             pointy.Float64(10 * 1024 * 1024 * 1024),
							Name:             pointy.String("new_disk_name"),
						},
						Boot: pointy.Int32(1),
						Bus:  models.BusVIRTIO.Pointer(),
					},
				},
			},
		},
	}
	updatedVm, err := addVmDisk(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle created vm
}

func addVmDisk(
	client *apiclient.Cloudtower,
	addVMDiskParams *vm.AddVMDiskParams) (*models.VM, error) {
	updateRes, err := client.VM.AddVMDisk(addVMDiskParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Mount Existing Virtual Volume as Virtual Disk 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewAddVMDiskParams()
	updateParams.RequestBody = &models.VMAddDiskParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMAddDiskParamsData{
			VMDisks: &models.VMAddDiskParamsDataVMDisks{
				MountDisks: []*models.MountDisksParams{
					{
						Index:      pointy.Int32(0),
						VMVolumeID: pointy.String("vmVolumeId"),
						Boot:       pointy.Int32(0),
						Bus:        models.BusVIRTIO.Pointer(),
					},
				},
			},
		},
	}
	updatedVm, err := addVmDisk(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func addVmDisk(
	client *apiclient.Cloudtower,
	addVMDiskParams *vm.AddVMDiskParams) (*models.VM, error) {
	updateRes, err := client.VM.AddVMDisk(addVMDiskParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Uninstall Virtual Disk 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewRemoveVMDiskParams()
	updateParams.RequestBody = &models.VMRemoveDiskParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMRemoveDiskParamsData{
			DiskIds: []string{"diskId1", "diskId2"},
		},
	}
	updatedVm, err := removeVmDisk(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func removeVmDisk(
	client *apiclient.Cloudtower,
	removeVmDiskParams *vm.RemoveVMDiskParams) (*models.VM, error) {
	updateRes, err := client.VM.RemoveVMDisk(removeVmDiskParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### NIC Operations

##### Add NIC

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewAddVMNicParams()
	updateParams.RequestBody = &models.VMAddNicParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMAddNicParamsData{
			VMNics: []*models.VMNicParams{
				{
					ConnectVlanID: pointy.String("vlanId2"),
					Enabled:       pointy.Bool(true),
					Model:         models.VMNicModelVIRTIO.Pointer(),
				},
			},
		},
	}
	updatedVm, err := addVmNic(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func addVmNic(
	client *apiclient.Cloudtower,
	addVMNicParams *vm.AddVMNicParams) (*models.VM, error) {
	updateRes, err := client.VM.AddVMNic(addVMNicParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Edit NIC 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewUpdateVMNicParams()
	updateParams.RequestBody = &models.VMUpdateNicParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMUpdateNicParamsData{
			NicIndex: pointy.Int32(0),
			Enabled:  pointy.Bool(false),
			Mirror:   pointy.Bool(false),
		},
	}
	updatedVm, err := updateVmNic(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func updateVmNic(
	client *apiclient.Cloudtower,
	updateVMNicParams *vm.UpdateVMNicParams) (*models.VM, error) {
	updateRes, err := client.VM.UpdateVMNic(updateVMNicParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Delete NIC

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")
	updateParams := vm.NewRemoveVMNicParams()
	updateParams.RequestBody = &models.VMRemoveNicParams{
		Where: &models.VMWhereInput{
			ID: pointy.String("vmId"),
		},
		Data: &models.VMRemoveNicParamsData{
			NicIndex: []int32{0, 1},
		},
	}
	updatedVm, err := removeVmNic(client, updateParams)
	if err != nil {
		panic(err.Error())
	}
  // handle updated vm
}

func removeVmNic(
	client *apiclient.Cloudtower,
	removeVmDiskParams *vm.RemoveVMNicParams) (*models.VM, error) {
	updateRes, err := client.VM.RemoveVMNic(removeVmDiskParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := updateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}

```

#### Migrate Virtual Machine 

##### Migrate to Specified Host

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	migratedVm, err := migrateVmToHost(client, "vmId", "hostId")
	if err != nil {
		panic(err.Error())
	}
	// handle migrated vm
}

func migrateVmToHost(
	client *apiclient.Cloudtower,
	vmId string,
	hostId string) (*models.VM, error) {
	migrateParams := vm.NewMigRateVMParams()
	migrateParams.RequestBody = &models.VMMigrateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
		Data: &models.VMMigrateParamsData{
			HostID: pointy.String(hostId),
		},
	}
	migrateRes, err := client.VM.MigRateVM(migrateParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := migrateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Automatically Schedule to Proper Host 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	migratedVm, err := migrateVmAutoSchedule(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
	// handle migrated vm
}

func migrateVmAutoSchedule(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	migrateParams := vm.NewMigRateVMParams()
	migrateParams.RequestBody = &models.VMMigrateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	migrateRes, err := client.VM.MigRateVM(migrateParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := migrateRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

### Virtual Machine Power Operations

#### Power On Virtual Machine 

##### Power On Specified Virtual Machine and Automatically Schedule It to Proper Host 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	startedVm, err := startVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle started vm
}

func startVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	startParams := vm.NewStartVMParams()
	startParams.RequestBody = &models.VMStartParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	startRes, err := client.VM.StartVM(startParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := startRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Power On Virtual Machines In Batches and Automatically Schedule It to Proper Host 

```go
package main

import (
	"fmt"

	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	startedVms, err := startVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle started vms
}

func startVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	startParams := vm.NewStartVMParams()
	startParams.RequestBody = &models.VMStartParams{
		Where: where,
	}
	startRes, err := client.VM.StartVM(startParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := startRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}
```

##### Power on Virtual Machine on Specified Host 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	startedVm, err := startVmOnHost(client, "vmId", "hostId2")
	if err != nil {
		panic(err.Error())
	}
  // handle started vm
}

func startVmOnHost(
	client *apiclient.Cloudtower,
	vmId string,
	hostId string) (*models.VM, error) {
	startParams := vm.NewStartVMParams()
	startParams.RequestBody = &models.VMStartParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
		Data: &models.VMStartParamsData{
			HostID: pointy.String(hostId),
		},
	}
	startRes, err := client.VM.StartVM(startParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := startRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Shut Down Virtual Machine 

##### Shut Down Specified Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	shutdownVm, err := shutdownVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle shutdown vm
}

func shutdownVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	shutdownParams := vm.NewShutDownVMParams()
	shutdownParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	shutdownRes, err := client.VM.ShutDownVM(shutdownParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := shutdownRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Shut Down Virtual Machines In Batches

```go
package main

import (
	"fmt"

	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	shutdownVms, err := shutdownVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle shutdown vms
}

func shutdownVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	shutdownParams := vm.NewShutDownVMParams()
	shutdownParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	shutdownRes, err := client.VM.ShutDownVM(shutdownParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := shutdownRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}
```

##### Force Shut Down Specified Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	shutdownVm, err := forceShutdownVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle shutdown vm
}

func forceShutdownVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	shutdownParams := vm.NewForceShutDownVMParams()
	shutdownParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	shutdownRes, err := client.VM.ForceShutDownVM(shutdownParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := shutdownRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Force Shut Down Virtual Machines In Batches

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	shutdownVms, err := forceshutdownVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle shutdown vms
}


func forceshutdownVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	shutdownParams := vm.NewForceShutDownVMParams()
	shutdownParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	shutdownRes, err := client.VM.ForceShutDownVM(shutdownParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := shutdownRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}

```

#### Restart Virtual Machine

##### Restart Specified Virtual Machine 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	restartedVm, err := restartVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle restarted vm
}

func restartVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	restartParams := vm.NewRestartVMParams()
	restartParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	restartRes, err := client.VM.RestartVM(restartParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := restartRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Restart Virtual Machines In Batches 

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

  	restartedVms, err := restartVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle restarted vms
}

func restartVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	restartParams := vm.NewRestartVMParams()
	restartParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	restartRes, err := client.VM.RestartVM(restartParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := restartRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}
```

##### Force Restart Specified Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	restartedVm, err := forceRestartVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle restarted vm
}

func forceRestartVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	restartParams := vm.NewForceRestartVMParams()
	restartParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	shutdownRes, err := client.VM.ForceRestartVM(restartParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := shutdownRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Force Restart Virtual Machines In Batches 

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	restartedVms, err := forceRestartVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle restarted vms
}

func forceRestartVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	restartParams := vm.NewForceRestartVMParams()
	restartParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	startRes, err := client.VM.ForceRestartVM(restartParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := startRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}
```

#### Suspend Virtual Machine

##### Suspend Specified Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	suspendedVm, err := suspendVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle suspended vm
}

func suspendVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	suspendParams := vm.NewSuspendVMParams()
	suspendParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	shutdownRes, err := client.VM.SuspendVM(suspendParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := shutdownRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Suspend Virtual Machine In Batches 

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	suspendedVms, err := suspendVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
	// handle restarted vms
	print(suspendedVms)
}

func suspendVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	suspendParams := vm.NewSuspendVMParams()
	suspendParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	suspendRes, err := client.VM.SuspendVM(suspendParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := suspendRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}

```

#### Restore Virtual Machine 

##### Restore Specified Virtual Machine

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	resumedVm, err := resumeVm(client, "vmId")
	if err != nil {
		panic(err.Error())
	}
  // handle resumed vm
}

func resumeVm(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	resumeVmParams := vm.NewResumeVMParams()
	resumeVmParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	resumeRes, err := client.VM.ResumeVM(resumeVmParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := resumeRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Restore Virtual Machine In Batches

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	resumedVms, err := resumeVmsByQuery(client, &models.VMWhereInput{
		IDIn: []string{"vmId"},
	})
	if err != nil {
		panic(err.Error())
	}
  // handle resumed vms
}

func resumeVmsByQuery(client *apiclient.Cloudtower,
	where *models.VMWhereInput) ([]*models.VM, error) {
	resumeParams := vm.NewResumeVMParams()
	resumeParams.RequestBody = &models.VMOperateParams{
		Where: where,
	}
	resumeRes, err := client.VM.ResumeVM(resumeParams)
	if err != nil {
		return nil, err
	}
	withTaskVms := resumeRes.Payload
	taskIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.TaskID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse task ids")
	}
	vmIds, valid := funk.Map(withTaskVms, func(vm *models.WithTaskVM) string {
		return *vm.Data.ID
	}).([]string)
	if !valid {
		return nil, fmt.Errorf("failed to parse vm ids")
	}
	err = utils.WaitTasks(client, taskIds)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			IDIn: vmIds,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload, nil
}

```

### Delete Virtual Machine

#### Recycle Bin 

##### Move to Recycle Bin 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	vmInRecycleBin, err := moveVmToRecycleBin(client, "vmId")

	if err != nil {
		panic(err.Error())
	}
	// fmt.Print(vms)
	print(vmInRecycleBin)
}

func moveVmToRecycleBin(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	moveParams := vm.NewMoveVMToRecycleBinParams()
	moveParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	moveRes, err := client.VM.MoveVMToRecycleBin(moveParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := moveRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

##### Restore from Recycle Bin 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	vmInRecycleBin, err := recoverVmFromRecycleBin(client, "vmId")

	if err != nil {
		panic(err.Error())
	}
	// fmt.Print(vms)
	print(vmInRecycleBin)
}

func recoverVmFromRecycleBin(
	client *apiclient.Cloudtower,
	vmId string) (*models.VM, error) {
	recoverParams := vm.NewRecoverVMFromRecycleBinParams()
	recoverParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	recoverRes, err := client.VM.RecoverVMFromRecycleBin(recoverParams)
	if err != nil {
		return nil, err
	}
	withTaskVm := recoverRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return nil, err
	}
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			ID: withTaskVm.Data.ID,
		},
	}
	queryRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, err
	}
	return queryRes.Payload[0], nil
}
```

#### Permanently Delete 

```go
package main

import (
	"github.com/openlyinc/pointy"
	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func main() {
	transport := httptransport.New("192.168.36.133", "/v2/api", []string{"http"})
	client := apiclient.New(transport, strfmt.Default)
	transport.DefaultAuthentication = httptransport.APIKeyAuth("Authorization", "header", "token")

	err := deleteVm(client, "vmId")

	if err != nil {
		panic(err.Error())
	}
}

func deleteVm(
	client *apiclient.Cloudtower,
	vmId string) error {
	deleteParams := vm.NewDeleteVMParams()
	deleteParams.RequestBody = &models.VMOperateParams{
		Where: &models.VMWhereInput{
			ID: pointy.String(vmId),
		},
	}
	deleteRes, err := client.VM.DeleteVM(deleteParams)
	if err != nil {
		return err
	}
	withTaskVm := deleteRes.Payload[0]
	err = utils.WaitTask(client, withTaskVm.TaskID)
	if err != nil {
		return err
	}
	return nil
}
```

## Scenario Examples 

### Virtual Machine Backup 

```go
package main

import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/iscsi_lun_snapshot"
	"github.com/smartxworks/cloudtower-go-sdk/client/user"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm"
	"github.com/smartxworks/cloudtower-go-sdk/client/vm_snapshot"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/smartxworks/cloudtower-go-sdk/utils"
	"github.com/openlyinc/pointy"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

func create_vm_snapshot(
  client *apiclient.Cloudtower,
	targetVmName string,
	targetSnapshotName string,
	consistentType models.ConsistentType) (*models.VMSnapshot, []*models.IscsiLunSnapshot, error) {
	getVmParams := vm.NewGetVmsParams()
	getVmParams.RequestBody = &models.GetVmsRequestBody{
		Where: &models.VMWhereInput{
			Name: &targetVmName,
		},
		First: pointy.Int32(1),
	}
	getVmRes, err := client.VM.GetVms(getVmParams)
	if err != nil {
		return nil, nil, err
	}
	targetVm := getVmRes.Payload[0]
	vmToolStatus := *targetVm.VMToolsStatus
	if vmToolStatus != models.VMToolsStatusRUNNING && consistentType == models.ConsistentTypeFILESYSTEMCONSISTENT {
		consistentType = models.ConsistentTypeCRASHCONSISTENT
	}
	createSnapshotParams := vm_snapshot.NewCreateVMSnapshotParams()
	createSnapshotParams.RequestBody = &models.VMSnapshotCreationParams{
		Data: []*models.VMSnapshotCreationParamsDataItems0{
			{
				VMID:           targetVm.ID,
				Name:           &targetSnapshotName,
				ConsistentType: consistentType.Pointer(),
			},
		},
	}
	createRes, err := client.VMSnapshot.CreateVMSnapshot(createSnapshotParams)
	if err != nil {
		return nil, nil, err
	}
	withTaskSnapshot := createRes.Payload[0]
	err = utils.WaitTask(client, withTaskSnapshot.TaskID)
	if err != nil {
		return nil, nil, err
	}
	getSnapshotParams := vm_snapshot.NewGetVMSnapshotsParams()
	getSnapshotParams.RequestBody = &models.GetVMSnapshotsRequestBody{
		Where: &models.VMSnapshotWhereInput{
			ID: withTaskSnapshot.Data.ID,
		},
	}
	getSnapshotRes, err := client.VMSnapshot.GetVMSnapshots(getSnapshotParams)
	if err != nil {
		return nil, nil, err
	}
	createdSnapshot := getSnapshotRes.Payload[0]

	lunSnapshotIds := funk.Map(funk.Filter(createdSnapshot.VMDisks, func(disk *models.NestedFrozenDisks) bool {
		return *disk.Type == models.VMDiskTypeDISK
	}), func(disk *models.NestedFrozenDisks) string {
		return *disk.SnapshotLocalID
	}).([]string)
	getLunSnapshotParams := iscsi_lun_snapshot.NewGetIscsiLunSnapshotsParams()
	getLunSnapshotParams.RequestBody = &models.GetIscsiLunSnapshotsRequestBody{
		Where: &models.IscsiLunSnapshotWhereInput{
			NameIn: lunSnapshotIds,
		},
	}
	getLunSnapshotRes, err := client.IscsiLunSnapshot.GetIscsiLunSnapshots(getLunSnapshotParams)
	if err != nil {
		return nil, nil, err
	}
	return createdSnapshot, getLunSnapshotRes.Payload, nil
}
```

### Build Dashboard

#### Define Tool Library

```go
import (
	"fmt"

	apiclient "github.com/smartxworks/cloudtower-go-sdk/client"
	"github.com/smartxworks/cloudtower-go-sdk/client/alert"
	"github.com/smartxworks/cloudtower-go-sdk/client/cluster"
	"github.com/smartxworks/cloudtower-go-sdk/client/disk"
	"github.com/smartxworks/cloudtower-go-sdk/client/host"
	"github.com/smartxworks/cloudtower-go-sdk/client/user"
	"github.com/smartxworks/cloudtower-go-sdk/models"
	"github.com/openlyinc/pointy"
	"github.com/thoas/go-funk"

	httptransport "github.com/go-openapi/runtime/client"

	"github.com/go-openapi/strfmt"
)

var ByteUnits []string = []string{"B", "KiB", "MiB", "GiB", "TiB", "PiB"}
var HzUnits []string = []string{"Hz", "KHz", "MHz", "GHz", "THz"}

func formatUnit(base float64, units []string, step int32) string {
	length := len(units)
	if length == 0 {
		panic("No unit provided")
	}
	if base <= 0 {
		return fmt.Sprintf("0%s", units[0])
	}
	for i, unit := range units {
		if base < float64(step) || i == length-1 {
			return fmt.Sprintf("%0.2f%s", base, unit)
		}
		base = base / float64(step)
	}
	return fmt.Sprintf("%0.2f%s", base, units[length-1])
}
```

#### Build Alert Information 

```go
type AlertInfo struct {
	Critical []*models.Alert
	Notice   []*models.Alert
	Info     []*models.Alert
}

func NewAlertInfo(critial []*models.Alert, notice []*models.Alert, info []*models.Alert) *AlertInfo {
	return &AlertInfo{
		Critical: critial,
		Notice:   notice,
		Info:     info,
	}
}

func buildAlertInfo(client *apiclient.Cloudtower, clusterIds []string) (*AlertInfo, error) {
	getAlertParams := alert.NewGetAlertsParams()
	if len(clusterIds) == 0 {
		getAlertParams.RequestBody = &models.GetAlertsRequestBody{
			Where: &models.AlertWhereInput{
				Ended: pointy.Bool(false),
			},
		}
	} else {
		getAlertParams.RequestBody = &models.GetAlertsRequestBody{
			Where: &models.AlertWhereInput{
				Ended: pointy.Bool(false),
				Cluster: &models.ClusterWhereInput{
					IDIn: clusterIds,
				},
			},
		}
	}
	res, err := client.Alert.GetAlerts(getAlertParams)
	if err != nil {
		return nil, err
	}
	var critial []*models.Alert = []*models.Alert{}
	var notice []*models.Alert = []*models.Alert{}
	var info []*models.Alert = []*models.Alert{}
	for _, alert := range res.Payload {
		switch *alert.Severity {
		case "CRITICAL":
			critial = append(critial, alert)
		case "NOTICE":
			notice = append(notice, alert)
		case "INFO":
			info = append(info, alert)
		}
	}
	return NewAlertInfo(critial, notice, info), nil
}
```

#### Build Hard Disk Information 

> Here is an example of a mechanical hard drive.

```go
type DiskInfo struct {
	Healthy int32
	Warning int32
	Error   int32
	Total   int32
}

func NewDiskInfo() *DiskInfo {
	return &DiskInfo{
		Healthy: 0,
		Warning: 0,
		Error:   0,
		Total:   0,
	}
}

func buildHddInfo(client *apiclient.Cloudtower, clusterIds []string) (*DiskInfo, error) {
	getDiskParams := disk.NewGetDisksParams()
	if len(clusterIds) == 0 {
		getDiskParams.RequestBody = &models.GetDisksRequestBody{}
	} else {
		getDiskParams.RequestBody = &models.GetDisksRequestBody{
			Where: &models.DiskWhereInput{
				Host: &models.HostWhereInput{
					Cluster: &models.ClusterWhereInput{
						IDIn: clusterIds,
					},
				},
			},
		}
	}
	res, err := client.Disk.GetDisks(getDiskParams)
	if err != nil {
		return nil, err
	}
	hddInfo := NewDiskInfo()
	for _, disk := range res.Payload {
		if *disk.Type == models.DiskTypeHDD {
			if funk.Contains(
				[]models.DiskHealthStatus{
					models.DiskHealthStatusHEALTHY,
					models.DiskHealthStatusSUBHEALTHY,
					models.DiskHealthStatusSMARTFAILED,
				},
				*disk.HealthStatus,
			) {
				hddInfo.Error++
			} else if funk.Contains(
				[]models.DiskUsageStatus{
					models.DiskUsageStatusUNMOUNTED,
					models.DiskUsageStatusPARTIALMOUNTED,
				},
				*disk.UsageStatus,
			) {
				hddInfo.Warning++
			} else {
				hddInfo.Healthy++
			}
			hddInfo.Total++
		}
	}
	return hddInfo, nil
}
```

#### Build Performance Metrics

> Get the number of CPU cores, total CPU frequency, CPU usage, total memory, memory usage, total storage resources, used storage resources, invalid storage resources, and available storage resources of the specified cluster.

```go
type CpuInfo struct {
	TotalCore uint32
	TotalInHz uint64
	Total     string
	UsedInHz  uint64
	Used      string
	Usage     string
}

func NewCpuInfo() *CpuInfo {
	return &CpuInfo{
		TotalCore: 0,
		TotalInHz: 0,
		UsedInHz:  0,
	}
}

func (info *CpuInfo) compute() *CpuInfo {
	info.Total = formatUnit(float64(info.TotalInHz), HzUnits, 1000)
	info.Used = formatUnit(float64(info.UsedInHz), HzUnits, 1000)
	info.Usage = fmt.Sprintf("%0.2f%%", float64(info.UsedInHz)/float64(info.TotalInHz))
	return info
}

type MemoryInfo struct {
	TotalInByte uint64
	Total       string
	UsedInByte  uint64
	Used        string
	Usage       string
}

func NewMemoryInfo() *MemoryInfo {
	return &MemoryInfo{
		TotalInByte: 0,
		UsedInByte:  0,
	}
}

func (info *MemoryInfo) compute() *MemoryInfo {
	info.Total = formatUnit(float64(info.TotalInByte), ByteUnits, 1024)
	info.Used = formatUnit(float64(info.UsedInByte), ByteUnits, 1024)
	info.Usage = fmt.Sprintf("%0.2f%%", float64(info.UsedInByte)/float64(info.TotalInByte))
	return info
}

type StorageInfo struct {
	TotalInByte     uint64
	Total           string
	UsedInByte      uint64
	Used            string
	InvalidInByte   uint64
	Invalid         string
	AvailableInByte uint64
	Available       string
}

func NewStorageInfo() *StorageInfo {
	return &StorageInfo{
		TotalInByte:     0,
		UsedInByte:      0,
		InvalidInByte:   0,
		AvailableInByte: 0,
	}
}

func (info *StorageInfo) compute() *StorageInfo {
	info.AvailableInByte = info.TotalInByte - info.UsedInByte - info.InvalidInByte
	info.Total = formatUnit(float64(info.TotalInByte), ByteUnits, 1024)
	info.Used = formatUnit(float64(info.UsedInByte), ByteUnits, 1024)
	info.Invalid = formatUnit(float64(info.InvalidInByte), ByteUnits, 1024)
	info.Available = formatUnit(float64(info.AvailableInByte), ByteUnits, 1024)
	return info
}

type MetricInfo struct {
	Storage *StorageInfo
	Memory  *MemoryInfo
	Cpu     *CpuInfo
}

func buildMetricsInfo(client *apiclient.Cloudtower, clusters []*models.Cluster, clusterIds []string) (*MetricInfo, error) {
	memory := NewMemoryInfo()
	storage := NewStorageInfo()
	cpu := NewCpuInfo()
	getHostParams := host.NewGetHostsParams()
	if len(clusterIds) == 0 {
		getHostParams.RequestBody = &models.GetHostsRequestBody{}
	} else {
		getHostParams.RequestBody = &models.GetHostsRequestBody{
			Where: &models.HostWhereInput{
				Cluster: &models.ClusterWhereInput{
					IDIn: clusterIds,
				},
			},
		}
	}
	hosts, err := client.Host.GetHosts(getHostParams)
	if err != nil {
		return nil, err
	}
	clusterIdMap := make(map[string]*models.Cluster)
	for _, cluster := range clusters {
		if _, ok := clusterIdMap[*cluster.ID]; !ok {
			clusterIdMap[*cluster.ID] = cluster
		}
		if *cluster.Type == models.ClusterTypeSMTXOS {
			cpu.TotalCore += uint32(*cluster.TotalCPUCores)
			cpu.TotalInHz += uint64(*cluster.TotalCPUHz)
			cpu.UsedInHz += uint64(*cluster.UsedCPUHz)
			if cluster.Hypervisor != nil && *cluster.Hypervisor == models.HypervisorVMWARE {
				memory.TotalInByte += uint64(*cluster.TotalMemoryBytes)
				memory.UsedInByte += uint64(*cluster.UsedMemoryBytes)
			}
		}
		storage.TotalInByte += uint64(*cluster.TotalDataCapacity)
		storage.UsedInByte += uint64(*cluster.UsedDataSpace)
		storage.InvalidInByte += uint64(*cluster.FailureDataSpace)
	}
	for _, host := range hosts.Payload {
		cluster, ok := clusterIdMap[*host.Cluster.ID]
		if ok {
			if *cluster.Hypervisor == models.HypervisorELF {
				memory.TotalInByte += uint64(*host.TotalMemoryBytes)
				memory.UsedInByte += uint64(*host.UsedMemoryBytes)
			}
		}
	}
	storage.compute()
	cpu.compute()
	memory.compute()
	return &MetricInfo{
		Memory:  memory,
		Cpu:     cpu,
		Storage: storage,
	}, nil
}
```

#### Build Dashboard

```go
type DashboardInfo struct {
	Metric *MetricInfo
	Hdd    *DiskInfo
	Alert  *AlertInfo
}

func BuildDashboard(client *apiclient.Cloudtower, clusterIds []string) (*DashboardInfo, error) {
	getClusterParams := cluster.NewGetClustersParams()
	if len(clusterIds) == 0 {
		getClusterParams.RequestBody = &models.GetClustersRequestBody{}
	} else {
		getClusterParams.RequestBody = &models.GetClustersRequestBody{
			Where: &models.ClusterWhereInput{
				IDIn: clusterIds,
			},
		}
	}
	res, err := client.Cluster.GetClusters(getClusterParams)
	if err != nil {
		return nil, err
	}
	metrics, err := buildMetricsInfo(client, res.Payload, clusterIds)
	if err != nil {
		return nil, err
	}
	hdd, err := buildHddInfo(client, clusterIds)
	if err != nil {
		return nil, err
	}
	alert, err := buildAlertInfo(client, clusterIds)
	if err != nil {
		return nil, err
	}
	return &DashboardInfo{
		Metric: metrics,
		Hdd:    hdd,
		Alert:  alert,
	}, nil
}
```