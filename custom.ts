
/**
* Use this file to define custom export functions and blocks.
* Read more at https://makecode.microbit.org/blocks/custom
*/

enum MyEnum {
    //% block="one"
    One,
    //% block="two"
    Two
}

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon=""
namespace airbit {

    /**
    * Draw a vertical bar with gradients for prescicion
    * X = 0..4 x position on screen, amount = 0..100
    */

    //% blockID=airbit_smart_bar
    //% block="Smart Bar $x $amount"
    //% group='Screen'
    //% x.min = 0 x.max=4
    //% amount.min = 0 amount.max = 100

    export function smartBar(x: number, amount: number) {
        for (let index = 0; index <= amount / 20; index++) {
            led.plot(x, 4 - index)
        }
        led.plotBrightness(x, 4 - Math.floor(amount / 20), 12.75 * (amount % 20))
    }

   

    // 0 = no gyro
    // 1 = ICM-20602
    // 2 = LSM6DSOX

    export function DetectGyro() {

        gyroType = 0

        // Test LSM6DSOX on 0x6A
        pins.i2cWriteNumber(
            0x6A,
            0x0F,
            NumberFormat.UInt8BE,
            true
        )

        let who = pins.i2cReadNumber(
            0x6A,
            NumberFormat.UInt8BE,
            false
        )

        if (who == 0x6C) {
            gyroType = 2
            return
        }

        // Test ICM-20602 on 0x68
        pins.i2cWriteNumber(
            0x68,
            0x75,
            NumberFormat.UInt8BE,
            true
        )

        who = pins.i2cReadNumber(
            0x68,
            NumberFormat.UInt8BE,
            false
        )

        if (who == 0x12) {
            gyroType = 1
            return
        }
    }



    /**
     * Erase PID registers
     */

    //% blockID=airbit_clean_reg
    //% block="Clean Registers"
    //% group='Control'

    export function cleanReg() {
        imuRoll = 0
        imuPitch = 0
        rollDiff = 0
        pitchDiff = 0
        lastRollDiff = 0
        lastPitchDiff = 0
        lastYawDiff = 0
        rollIdiff = 0
        pitchIdiff = 0
        yawIdiff = 0
        yawDiff = 0
        yawDdiff = 0
        lastRollDiff = 0
        lastPitchDiff = 0
      
        pitchPdiff = 0
        rollPdiff = 0
        pitchDdiff = 0
        rollDdiff = 0
        imuYaw = 0
        gyroZdelta = 0
        yaw = 0
        rollCorrection = 0
        pitchCorrection = 0

    }

    //let batteryVoltage = 0
    //  let batterymVoltSmooth = 0
    /**
     * Battery level in %
     */
    //% blockID=airbit_battery_level
    //% block="Battery Level"
    //% group='Battery management'

    export function batteryLevel() {
        batteryCalculation()
        return Math.map(batterymVoltSmooth, 3400, 4200, 0, 100)
    }


    /**
    *   Battery calculation with smoothing (low pass filter)
    */

    //% blockID=airbit_battery_calculation
    //% block="Battery Calculation"
    //% group='Battery management'

    export function batteryCalculation() {
        batterymVoltSmooth = Math.round(pins.analogReadPin(AnalogPin.P0) * BATTERY_FACTOR * 0.1 + batterymVoltSmooth * 0.9)

    }

    /**
       Battery calculation (no smoothing) 
    */

    //% blockID=airbit_battery_calculation_simple
    //% block="Battery milliVolts"
    //% group='Battery management'

    export function batterymVolt() {
        return Math.round(pins.analogReadPin(AnalogPin.P0) * BATTERY_FACTOR)

    }


    /**
     * Read from the motor controller
     */

    //% blockID=airbit_read_pca
    //% block="Read Motor Controller"
    //% group='System'

    export function readPCA(num: number) {
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            num,
            NumberFormat.UInt8BE,
            true
        )
        return pins.i2cReadNumber(PCA_REG_SLAVEADR, NumberFormat.UInt8BE, false)
    }

    export function radioSend() {
        radio.sendValue("B", batterymVoltSmooth)
        radio.sendValue("G", input.acceleration(Dimension.Z))
        radio.sendValue("Te", input.temperature())
        radio.sendValue("Rd", Math.round(imuRoll))
        radio.sendValue("Pd", Math.round(imuPitch))
    }

    /*
        export function PCA_ReadMode2() {
            pins.i2cWriteNumber(
                PCA_REG_SLAVEADR,
                PCA_REG_MODE2,
                NumberFormat.UInt8BE,
                true
            )
            return pins.i2cReadNumber(PCA_REG_SLAVEADR, NumberFormat.UInt8BE, false)
        }
        */


    
    /** 
     * 
     * Plot a rotating dot
     * xPos and yPos is the center point 0..4
     * Radius 1..4 (size)
     * Speed -100..100, use negative value for counter clock rotation
    */
    //% blockID=airbit_rotation_dot
    //% block="Rotation dot $xPos $yPos $radius $speed"
    //% xPos.min=0 xPos.max=4 xPos.dfl=2
    //% yPos.min=0 yPos.max=4 yPos.dfl=2
    //% radius.min=1 radius.max=4 radius.dfl=2
    //% speed.min=-100 speed.max=100 speed.dfl=10
    //% group='Screen'

    export function rotateDot(xPos: number, yPos: number, radius: number, speed: number) {
        led.plot(xPos + 0.5 + (radius+0.5) * Math.cos(input.runningTime() / 10000 * 6.283 * speed), yPos + 0.5 + (radius+0.5) * Math.sin(input.runningTime() / 10000 * 6.283 * speed))
    }



    /**
        Control the individual speed of each motor.
     */
    //% blockID=airbit_motor_speed
    //% block="Motor Speed $m0 $m1 $m2 $m3"
    //% m0.min=0 m0.max=255
    //% m1.min=0 m1.max=255
    //% m2.min=0 m2.max=255
    //% m3.min=0 m3.max=255

    //% group='Control'

    export function MotorSpeed(m0: number, m1: number, m2: number, m3: number) {
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            PCA_pwm0 << 8 | m3,
            NumberFormat.UInt16BE,
            false
        )
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            PCA_pwm1 << 8 | m2,
            NumberFormat.UInt16BE,
            false
        )
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            PCA_pwm2 << 8 | m1,
            NumberFormat.UInt16BE,
            false
        )
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            PCA_pwm3 << 8 | m0,
            NumberFormat.UInt16BE,
            false
        )
    }




    /**
     * Calculate the drone's Roll, Pitch and Roll angles from raw data.
     */

    //% blockID=airbit_calculate_angles
    //% block="Calculate Angles"
    //% group='Control'
   
    
    export function calculateAngles() {
        const GYROSCALE = 1 / 16.4 / 1000  // 0,00006097560976

        looptime = input.runningTime() - oldTime
        oldTime = input.runningTime()
        accPitch = (-57.295 * Math.atan2(accY, accZ)) - accPitchOffset
        accRoll = (-57.295 * Math.atan2(accX, accZ)) - accRollOffset
        //accRollTest = accRoll
        // Degrees away from desired angle
        gyroXdelta = (gyroX - gyroXcalibration) * looptime * -GYROSCALE
        gyroYdelta = (gyroY - gyroYcalibration) * looptime * GYROSCALE
        gyroZdelta = (gyroZ - gyroZcalibration) * looptime * -GYROSCALE
        imuRoll = (gyroYdelta + imuRoll) * 0.995 + accRoll * 0.005
        imuPitch = (gyroXdelta + imuPitch) * 0.995 + accPitch * 0.005
        imuYaw = gyroZdelta + imuYaw
        
        //imuRoll = gyroYdelta + imuRoll    // TEST
        //imuTest = gyroYdelta + imuTest
       // serial.writeLine("X" + imuRoll)
       // serial.writeLine("Y" + imuTest)
        //basic.pause(20)
    }


    /*
       Start the IMU (gyro/ACC)
    */
    //% blockID=airbit_start_imu
    //% block="Start Gyro/Acc"
    //% group='Control'

    export function IMU_Start(){
       
        if (gyroType == 1) {
       
        IMU1_Start()    
        } else if (gyroType ==2){

        IMU2_Start()    
        }
    }

    /*
       Start and setup the Gyro/Accelereometer sensor Version 2
    */

    //% blockID=airbit_start_imu_2
    //% block="Start Gyro/Acc 2"
    //% group='Control'


    export function IMU2_Start() {
        /*
        // --- WHO_AM_I check ---
        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x0F, NumberFormat.UInt8BE, true)
        let who = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.UInt8BE, false)

        basic.clearScreen()
        if (who == 0x6C) {          
            basic.showString("G")
            gyroExists = true
        } else {
            basic.showString("NG", 50)
            gyroExists = false
            return
        }

        basic.pause(20)
        */

        // --- Reset ---
        // CTRL3_C (0x12): SW_RESET = 1
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x12 << 8) | 0x01,
            NumberFormat.UInt16BE,
            false
        )
        basic.pause(50)

        // --- Enable auto-increment ---
        // CTRL3_C: IF_INC = 1
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x12 << 8) | 0x04,
            NumberFormat.UInt16BE,
            false
        )

        // --- Gyro setup ---
        // CTRL2_G (0x11)
        // ODR = 208 Hz (0x50)
        // FS = ±2000 dps (0x0C)
        // → 0x5C
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x11 << 8) | 0x6C,     //6 = 416 Hz/136, 7=833Hz/295, ±2000 dps
            NumberFormat.UInt16BE,
            false
        )

        // CTRL6_C (0x15)
        // GYRO LPF1 bandwidth setting
        // 0x00 = strongest filtering (~100 Hz-ish ved 208 Hz ODR)

        pins.i2cWriteNumber(
        IMU2_REG_ADDRESS,
        (0x15 << 8) | 0x00,
        NumberFormat.UInt16BE,
        false
        )

        // --- Accelerometer setup ---
        // CTRL1_XL (0x10)
        // ODR = 208 Hz (0x50)
        // FS = ±4g (0x08)
        // BW = ~50–100 Hz (balanced)
        // → 0x58
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x10 << 8) | 0x58,
            NumberFormat.UInt16BE,
            false
        )

        // CTRL8_XL (0x17)
        // Enable LPF2 + strong filtering


        // --- Accelerometer low-pass filter ---
        // CTRL8_XL (0x17)
        // LPF2 enabled, strong filtering (~10–20 Hz effective)
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x17 << 8) | 0x09,
            NumberFormat.UInt16BE,
            false
        )

        // --- Gyro performance mode ---
        // CTRL7_G (0x16)
        // High-performance, no extra filtering
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            (0x16 << 8) | 0x00,
            NumberFormat.UInt16BE,
            false
        )

        basic.pause(20)
    }


    /*
       Start and setup the Gyro/Accelereometer sensor version 1
    */

    //% blockID=airbit_start_imu_1
    //% block="Start Gyro/Acc 1"
    //% group='Control'

    export function IMU1_Start() {
        // Full reset chip (H_RESET, internal 20MHz clock)
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_PWR_MGMT_1 << 8 | 0x80,
            NumberFormat.UInt16BE,
            false
        )
        basic.pause(500)
        /*
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_WHO_AM_I,
            NumberFormat.UInt8BE,
            true
        )
        gyroReturnId = pins.i2cReadNumber(IMU_REG_ADDRESS, NumberFormat.Int16BE, false)
        // basic.showNumber(IMU_Return >> 8)

        basic.clearScreen()
        if (gyroReturnId >> 8 > 0) {
            basic.showString("G")
            gyroExists = true
        } else {
            basic.showString("NG", 50)
            gyroExists = false
        }
        */

        // Gyro range = ±2000 dps
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_GYRO_CONFIG << 8 | 0x18,  
            NumberFormat.UInt16BE,
            false
        )

        // set clock to internal PLL
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_PWR_MGMT_1 << 8 | 0x01,
            NumberFormat.UInt16BE,
            false
        )
        // // place accel and gyro on standby
        // pins.i2cWriteNumber(
        // mpuAddress,
        // imu_PWR_MGMT_2 << 8 | 0x3f,
        // NumberFormat.UInt16BE,
        // false
        // )
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_SIGNAL_PATH_RESET << 8 | 0x07,
            NumberFormat.UInt16BE,
            false
        )
        // disable fifo
        // was 0x01, FIFO only available for serial
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_USER_CTRL << 8 | 0x00,
            NumberFormat.UInt16BE,
            false
        )
        // disable fifo
        // Filter setting: DLP_CFG = 0(250 Hz), 1(176 Hz)
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_USER_CTRL << 8 | 0x00,
            NumberFormat.UInt16BE,
            false
        )
        // Gyro filter setting to 0 (250 Hz), 1 (176 Hz),  2 (92 Hz), 3 (41 Hz)
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_REG_CONFIG << 8 | 0,
            NumberFormat.UInt16BE,
            false
        )
        // Accel range = ±4g
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_ACCEL_CONFIG << 8 | 0x08,
            NumberFormat.UInt16BE,
            false
        )

        // Acc filter setting to 3 (44.8 Hz), 4 (21,2 Hz), 5 (10.2 Hz)
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            IMU_ACCEL_CONFIG_2 << 8 | 5,
            NumberFormat.UInt16BE,
            false
        )
    }



    /*
      Write to the motor controller
    */

    //% blockID=airbit_write_pca
    //% block="Write PCA"
    //% group='System'

    export function PCA_Write(register: number, value: number) {
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            register << 8 | value,
            NumberFormat.UInt16BE,
            false
        )
    }


    /*
    * Read gyro and acceleration from sensor
    */

    //% blockID=airbit_read_imu
    //% block="Read Gyro/Acc"
    //% group='Control'
    export function IMU_sensorRead(){
       
        if (gyroType == 1){
        IMU1_sensorRead()    
        } else if (gyroType == 2){
        IMU2_sensorRead()
        }
    }


    /*
    * Read gyro and acceleration from sensor type 2
    */

    //% blockID=airbit_read_imu2
    //% block="Read Gyro/Acc 2"
    //% group='Control'
    export function IMU2_sensorRead() {

        /*
        // --- Gyro (X, Y, Z) ---
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            0x22,
            NumberFormat.UInt8BE,
            true
        )
        gyroX = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, true)
        gyroY = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, true)
        gyroZ = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)
        */


        /*      This doesnt return all data correct
        // --- Accelerometer (X, Y, Z) ---
        pins.i2cWriteNumber(
            IMU2_REG_ADDRESS,
            0x28,
            NumberFormat.UInt8BE,
            true
        )
                accX = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, true)
                accY = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, true)
                accZ = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)
        */


        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x22, NumberFormat.UInt8BE, true)
        gyroX = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x24, NumberFormat.UInt8BE, true)
        gyroY = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x26, NumberFormat.UInt8BE, true)
        gyroZ = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x28, NumberFormat.UInt8BE, true)
        accX = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x2A, NumberFormat.UInt8BE, true)
        accY = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        pins.i2cWriteNumber(IMU2_REG_ADDRESS, 0x2C, NumberFormat.UInt8BE, true)
        accZ = pins.i2cReadNumber(IMU2_REG_ADDRESS, NumberFormat.Int16LE, false)

        accX = -accX
        accY = -accY

        gyroX = -gyroX
        gyroY = -gyroY        

    }



    /**
     * Read gyro and acceleration from sensor type 1
     */

    //% blockID=airbit_read_imu1
    //% block="Read Gyro/Acc 1"
    //% group='Control'

    export function IMU1_sensorRead() {
        pins.i2cWriteNumber(
            IMU_REG_ADDRESS,
            67,
            NumberFormat.Int8LE,
            true
        )
        gyroX = pins.i2cReadNumber(104, NumberFormat.Int16BE, true)
        gyroY = pins.i2cReadNumber(104, NumberFormat.Int16BE, true)
        gyroZ = pins.i2cReadNumber(104, NumberFormat.Int16BE, false)
        pins.i2cWriteNumber(
            104,
            59,
            NumberFormat.Int8LE,
            true
        )
        accX = pins.i2cReadNumber(104, NumberFormat.Int16BE, true)
        accY = pins.i2cReadNumber(104, NumberFormat.Int16BE, true)
        accZ = pins.i2cReadNumber(104, NumberFormat.Int16BE, false)
    }



    // Mode2:
    // Totem pole:
    // Inverted = %10101(21)
    // Non-inverted = %00101(5)
    // 
    // Open Drain:
    // Inverted = %10001(17)
    // Non-inverted = %00001(1)

    /**
    * Setup motor controller
    */

    //% blockID=airbit_start_pca
    //% block="Start Motor Controller"
    //% group='Control'

    export function PCA_Start() {
        PCA_Write(PCA_REG_MODE1, 128)
        PCA_Write(PCA_REG_MODE2, PCA_REG_MODE2_CONFIG)
        // Mode2:Inverted, Totem pole on = %10101(21), Non-inverted = %00101(5)
        // Mode2:Inverted, Open drain = %10001(17), Non-inverted = %00001(1)
        PCA_Write(PCA_REG_LEDUOT, 170)

        MotorSpeed(0, 0, 0, 0)     // Zero out motor speed 
        // Self test to see if data reg can be read.
        pins.i2cWriteNumber(
            PCA_REG_SLAVEADR,
            PCA_REG_MODE2,
            NumberFormat.UInt8BE,
            true
        )
        mcReturnId = pins.i2cReadNumber(PCA_REG_SLAVEADR, NumberFormat.UInt8BE, false)
        basic.clearScreen()
        if (mcReturnId) {
           // basic.showString("M")             Moved to main code, startup
            mcExists = true
        } else {
           // basic.showString("No PCA!", 50)   Moved to main code, startup
            mcExists = false
        }
    }


    /**
    * Calibrate the gyro
    */
    //% block

    /**
    * Calibrate the gyro and accelerometer
    */
    //% blockID=Calibrate Gyro / Acc
    //% block="Calibrate the offsets for gyro and accelerometer"



    //% blockID=airbit_calibrate_gyro
    //% block="Calibrate Gyro/Acc"
    //% group='Control'

    export function IMU_gyro_calibrate() {
        gyroXcalibration = 0
        gyroYcalibration = 0
        gyroZcalibration = 0
        let steadyCount = 0
        let filterShake = 0
        let filterDelta = 0
        let oldFilterDelta = 0
        let maxRoll = 5 //% Maximum roll to allow before calibration
        let maxPitch = 5 //% Maximum pitch to allow before calibration
        basic.showString("C")
        IMU2_sensorRead()
        calculateAngles()
        //accPitch = -57.295 * Math.atan2(accY, accZ)
        //accRoll = -57.295 * Math.atan2(accX, accZ)


    while (Math.abs(accRoll) > maxRoll || Math.abs(accPitch) > maxPitch )
        {
        IMU_sensorRead()
        calculateAngles()
        //accPitch = -57.295 * Math.atan2(accY, accZ)
        //accRoll = -57.295 * Math.atan2(accX, accZ)
        //basic.showNumber(accRoll)
        //basic.showString("Lay flat",100)
        //serial.writeValue("x", accRoll)
        }

    while (steadyCount < 100) {
        IMU_sensorRead()
        filterDelta = input.acceleration(Dimension.Strength) - oldFilterDelta
        oldFilterDelta = input.acceleration(Dimension.Strength)
        filterShake = Math.abs(filterDelta) * 0.1 + filterShake * 0.9
        //serial.writeValue("x", filterShake)
        accPitch = -57.295 * Math.atan2(accY, accZ)
        accRoll = -57.295 * Math.atan2(accX, accZ)
        basic.clearScreen()

        for (let i = 0; i < steadyCount / 20; i++) {
       // led.plot(i,0)   
       // led.plot(i,4) 
        led.plot(0,4-i)
        led.plot(4,4-i)
        }
        led.plot(accRoll/4+2.5,-accPitch/4+2.5)
        led.plot(accRoll / 4 + 3.5, -accPitch / 4 + 2.5)
        led.plot(accRoll / 4 + 1.5, -accPitch / 4 + 2.5)
        led.plot(accRoll / 4 + 2.5, -accPitch / 4 + 1.5)
        led.plot(accRoll / 4 + 2.5, -accPitch / 4 + 3.5)

        if (Math.abs(accRoll) < maxRoll  && Math.abs(accPitch) < maxPitch && filterShake < 14) {
            steadyCount +=1
        } else {
            steadyCount = 0
        }
        //serial.writeValue("x",steadyCount)
        //serial.writeValue("x", Math.abs(input.acceleration(Dimension.Strength)-oldStrength))
        //oldStrength = input.acceleration(Dimension.Strength)
        //serial.writeValue("y", accRoll)
        basic.pause(20)
        }


        for (let index = 0; index < 100; index++) {
            IMU_sensorRead()
            gyroXcalibration += gyroX
            gyroYcalibration += gyroY
            gyroZcalibration += gyroZ
            basic.pause(5)
        }
        gyroXcalibration = gyroXcalibration / 100
        gyroYcalibration = gyroYcalibration / 100
        gyroZcalibration = gyroZcalibration / 100
        accPitch = -57.295 * Math.atan2(accY, accZ)
        accRoll = -57.295 * Math.atan2(accX, accZ)
        accPitchOffset = accPitch
        accRollOffset = accRoll

        //accPitchOffset = 0
        //accRollOffset = 0

        basic.showIcon(IconNames.Yes)
    }




    /**
     * Use PID algorithm to generate the four motor speeds 
     */

    //% blockID=airbit_stabilise_pid
    //% block="Stabilise PID"
    //% group='Control'

    export function stabilisePid() {

        rollDiff = roll - imuRoll
        pitchDiff = pitch - imuPitch      // Reversing the pitch
        yawDiff = yaw - imuYaw
        rollDdiff = rollDiff - lastRollDiff
        pitchDdiff = pitchDiff - lastPitchDiff
        yawDdiff = yawDiff - lastYawDiff

        lastRollDiff = rollDiff
        lastPitchDiff = pitchDiff
        lastYawDiff = yawDiff

        let iRange = 100      //  Maximal error that will increase Roll and Pitch integral
        let iLimit = 7      //  Maximal correcton that can be added by integral
        let yawLimit = 120   //  Maximal yaw correction 
        //rollPitchI = 0.01
       
        if (throttle > 50) {    // Prevent windup before flight

            if (rollDiff > - iRange && rollDiff < iRange ){
                rollIdiff += rollDiff
            }
            if (pitchDiff > - iRange && pitchDiff < iRange) {
                pitchIdiff += pitchDiff
            }

        }

      
        let rollIcorrection = rollIdiff * rollPitchI
        let pitchIcorrection = pitchIdiff * rollPitchI

        //radio.sendValue("Rx", Math.round(roll))
        //radio.sendValue("Rd", Math.round(rollDiff))
        //radio.sendValue("Ro", Math.round(accRollOffset))
        //radio.sendValue("Ra", Math.round(accRoll))
        //radio.sendValue("Ri", rollPitchI)
        //radio.sendValue("Rc", Math.round(rollIcorrection))


        rollIcorrection = Math.constrain(rollIcorrection, -iLimit, iLimit)     // Limit I (preventing it from growing out of proportions)
        pitchIcorrection = Math.constrain(pitchIcorrection, -iLimit, iLimit)

     
        rollCorrection = rollDiff * rollPitchP + rollIcorrection + rollDdiff * rollPitchD
        pitchCorrection = pitchDiff * rollPitchP + pitchIcorrection + pitchDdiff * rollPitchD
        //yawCorrection = yawDiff * yawP 
        yawCorrection = yawDiff * yawP + yawDdiff * yawD
        yawCorrection = Math.constrain(yawCorrection, -yawLimit, yawLimit)
        throttleScaled = throttle * 2.55

        //tuningOut = rollIdiff * rollPitchI
        //tuningOutA = yawDiff
        //tuningOutB = rollIcorrection

        // rollCorrection = 0
        motorA = Math.round(throttleScaled + rollCorrection + pitchCorrection + yawCorrection)
        motorB = Math.round(throttleScaled + rollCorrection - pitchCorrection - yawCorrection)
        motorC = Math.round(throttleScaled - rollCorrection + pitchCorrection - yawCorrection)
        motorD = Math.round(throttleScaled - rollCorrection - pitchCorrection + yawCorrection)
        motorA = Math.constrain(motorA, 0, 255)
        motorB = Math.constrain(motorB, 0, 255)
        motorC = Math.constrain(motorC, 0, 255)
        motorD = Math.constrain(motorD, 0, 255)
    }


   


   // let imuRoll = 0
  
    let gyroReturnId = 0
    let mcReturnId = 0
    let calibratedRoll = 0
    let calibratedPitch = 0
    let throttleScaled = 0
    let yawCorrection = 0
    let pitchCorrection = 0
    let rollCorrection = 0
    let lastYawDiff = 0
    let pitchDdiff = 0
    let pitchDiff = 0
    let rollDiff = 0
    let accRollOffset = 0  //  Calibration offset of the Roll
    let accPitchOffset = 0  //  Calibration offset of the Pitch
    let soundStage = 0
    let oldTime = 0
    let aux = 0
    let startTime = 0
    let cpuTime = 0
    let yawIdiff = 0
    let yawDiff = 0
    let rollDdiff = 0
    let lastPitchDiff = 0
    let lastRollDiff = 0
    let pitchIdiff = 0
    let rollIdiff = 0
    let yawDdiff = 0
    let stable = 0
    let interruptCounter = 0
    let GYROSCALE = 0
    let gyroZcalibration = 0
    let gyroZ = 0
    let gyroZdelta = 0
    let gyroX = 0
    let gyroXcalibration = 0
  //  let gyroX = 0
    let gyroXdelta = 0
    let looptime = 0
    let gyroYcalibration = 0
    let gyroY = 0

    let gyroYdelta = 0
    let accY = 0
    let accRoll = 0
    let accZ = 0
    let accX = 0
    let accPitch = 0
    //   let imuPitch = 0
    //   let imuRoll = 0
    let batteryLev = 0
    let BATTERY_FACTOR = 5.94
    let arm = 0
    let mode = 0


    let PCA_REG_LEDUOT = 8
    let PCA_REG_SLAVEADR = 98
    let PCA_REG_MODE1 = 0
    let PCA_REG_MODE2 = 1
    let PCA_pwm0 = 2
    let PCA_pwm1 = 3
    let PCA_pwm2 = 4
    let PCA_pwm3 = 5
    let PCA_return = 0
    let BARO_return = 0
    let pitchPdiff = 0
    let rollPdiff = 0
    let gyroYangle = 0
    let gyroXangle = 0
    let gyroZangle = 0
    let tuning = 0
    let PCA_REG_MODE2_CONFIG = 5        // Non-inverted: Open Drain: = %00001(1), Totem: = %00101(5), Inverted: Totem = %10101(21), Open drain: = %10001(17)
    let IMU_REG_CONFIG = 1          // 0x6b
    let IMU_PWR_MGMT_1 = 107        // 0x6b
    let IMU_PWR_MGMT_2 = 108        // 0x6B
    let IMU_WHO_AM_I = 117              // 0x68
    let IMU_SIGNAL_PATH_RESET = 105 // 0x6a
    let IMU_USER_CTRL = 106
    let IMU_GYRO_CONFIG = 27
    let IMU_ACCEL_CONFIG = 28
    let IMU_ACCEL_CONFIG_2 = 29
    let IMU_REG_ADDRESS = 104
    let IMU2_REG_ADDRESS = 0x6a

    let BARO_REG_SLAVEADR = 99
/*    let magicNumber = "P1.5,I0.5,D0.35,Y2.5"
    magicNumber = "P1.2,I20,D0.2,Y2"
    magicNumber = "P1.2,I0.015,D50,Yp20,Yi0.01"
    magicNumber = "git:P1.3,I0.04,D18,Yp4,Yi0.02"
    magicNumber = "P0.5,I0,D15,Yp3,Yi0"
    rollPitchP = 0.5
    rollPitchI = 0
    rollPitchD = 15
    */

    let radioGroup = 7
    let motorSpeed = -1





}

