module.exports = (mongoose) => {
    const MonitoringGroup = mongoose.model(
        "MonitoringGroup",
        mongoose.Schema(
            {
                groupid: {
                    type: String,
                    default: ""
                },
                chainid: {
                    type: String,
                    default: ""
                },
                tokenaddress: {
                   type: String,
                   default: ""
                },
                tokendecimals: {
                    type: Number,
                    default: 0
                },
                alttokenaddress: {
                    type: String,
                    default: ""
                },
                alttokendecimals: {
                    type: Number,
                    default: 0
                },
                pooladdress: {
                   type: String,
                   default: ""
                },
                comptype: {
                    type: String,
                    default: ""
                },
                complength: {
                    type: Number,
                    default: 0
                },
                compminbuy: {
                    type: Number,
                    default: 0
                },
                compmusthold: {
                    type: Number,
                    default: 0
                },
                compstarttime: {
                    type: Number,
                    default: 0
                },
                prize1: {
                    type: Number,
                    default: 0
                },
                prize2: {
                    type: Number,
                    default: 0
                },
                prize3: {
                    type: Number,
                    default: 0
                },                
                paidHash1: {
                    type: String,
                    default: ""                 
                },                
                paidHash2: {
                    type: String,
                    default: ""                 
                },                
                paidHash3: {
                    type: String,
                    default: ""                 
                },
                isStopped: {
                    type: Boolean,
                    default: true
                },
                disqwallets: {
                    type: Array,
                    default: []
                },
                paymentWalletKey: {
                    type: String,
                    default: ""
                }
            },
            { timestamps: true }
        )
    );
    return MonitoringGroup;
};
